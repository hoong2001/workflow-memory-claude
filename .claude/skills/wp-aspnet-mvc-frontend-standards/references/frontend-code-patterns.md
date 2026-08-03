# Frontend Code Patterns — Copy-Ready Examples

> Companion to `SKILL.md`. The SKILL.md carries the **rules**; this file carries the
> **how-to** — one concrete, copy-ready example per rule. Section headings mirror SKILL.md
> so you can jump straight from a rule to its code.
>
> **Reminder on inline literals:** URLs (`/api/districts`), status codes (`401`/`403`),
> messages, and `'-- Select --'` below are illustrative only. In real code, extract them
> into named constants, a `CONFIG`/`PAGE_CONFIG` object, or an `apiUrlObj` — the
> "no magic numbers / strings" rule still applies.

---

## Store-Then-Bind

**Backend → Frontend (inbound)** — store the response to a module-scope variable first, then bind:
```javascript
let tableData = null;

$.ajax({
    url: API_URL,
    success: (response) => {
        tableData = response.data;   // Store first
        bindDataToTable(tableData);  // Then bind
    }
});
```

The outbound direction's concrete code is *AJAX Standard Pattern* below (collect into a variable → validate → send).

---

## Razor → JavaScript Data Passing

✅ **Correct — pass via data attribute:**
```html
<div id="page-context"
     data-user-id="@ViewBag.UserId"
     data-region-id="@Model.RegionId">
</div>
```
```javascript
const USER_ID = parseInt($('#page-context').data('user-id'));
const REGION_ID = parseInt($('#page-context').data('region-id'));
```

✅ **Correct — init block at top of script** (quoting is type-driven; see SKILL.md safety rules):
```javascript
// Page init data from server
const PAGE_CONFIG = {
    userId: @Model.UserId,                                   // Numeric property — unquoted
    userName: '@Model.UserName',                             // String — must be quoted
    userList: @Html.Raw(Json.Encode(Model.Users)),           // Complex object/collection — JSON serialize
    defaultDate: '@DateTime.Today.ToString("yyyy-MM-dd")'    // Formatted date is a string — quoted
};
```

❌ **Wrong — Razor mixed into JS logic:**
```javascript
function loadData() {
    $.ajax({ data: { id: @Model.Id } }); // Never do this
}
```

---

## Dropdown Binding

✅ **Static dropdown — Razor only:**
```html
@Html.DropDownList("regionId", Model.RegionList, "-- Select --", new { @class = "form-control" })
```

✅ **Cascading dropdown — AJAX:**
```javascript
function loadDistricts(regionId) {
    $.ajax({
        url: '/api/districts',
        data: { regionId },
        success: (response) => {
            if (response.success) bindDropdown('#districtSelect', response.data);
        }
    });
}
```

---

## Control Initialization

**DataTables — ALL tabular data.** Initialize once, keep the instance in a module-scope variable, reload via `clear().rows.add().draw()`. Never re-initialize on data refresh; destroy/re-init only if the column structure itself changes.
```javascript
let $orderTable = null;

function initOrderTable() {
    $orderTable = $('#orderTable').DataTable(getDataTableConfig());
}

function getDataTableConfig() {
    return {
        pageLength: 25,
        responsive: true,
        columns: [
            { data: 'orderNo' },
            { data: 'amount' }
        ]
    };
}

// Store-Then-Bind step 3 for tables
function bindDataToTable(data) {
    $orderTable.clear().rows.add(data).draw();
}
```

**Select2 — ALL select boxes:**
```javascript
$('#regionSelect').select2({
    allowClear: true,
    width: '100%',
    placeholder: SELECT_PLACEHOLDER
});
```

**Bootstrap Datepicker — ALL date inputs:**
```javascript
$('.date-input').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true
});
```

**ECharts — ALL charts.** Build the option object in a configuration factory (`getChartOption()`, section 10 of the page structure), never inline in the AJAX callback; bind via a `renderChart(data)` function following Store-Then-Bind.

**moment.js — ALL date formatting:** `moment(date).format('YYYY-MM-DD')`.

---

## AJAX Standard Pattern

```javascript
// ✅ Correct — collect into a variable first, then send
function handleSubmit() {
    if (!validateForm()) return;

    const submitPayload = {
        name: $('#name').val().trim(),
        regionId: parseInt($('#regionId').val()),
        startDate: $('#startDate').val()
    };

    $.ajax({
        url: API_URL,
        type: 'POST',
        contentType: 'application/json',        // Required for JSON body
        data: JSON.stringify(submitPayload),     // Required — never skip
        beforeSend: () => showLoading(),
        success: (response) => {
            if (response.success) {
                handleSuccess(response.data);
            } else {
                toastr.warning(response.message);
            }
        },
        error: (xhr) => handleAjaxError(xhr),
        complete: () => hideLoading()
    });
}

// ❌ Wrong — inline object, no variable, no JSON.stringify
$.ajax({
    url: API_URL,
    type: 'POST',
    data: { name: $('#name').val() }  // Missing JSON.stringify + contentType
});
```

### Standard Error Handler

Surface the backend's `message` when the response carries one; fall back to a generic message only when it doesn't.
```javascript
function handleAjaxError(xhr) {
    if (xhr.status === 401) {
        toastr.error('Session expired. Please login again.');
        window.location.href = LOGIN_URL + '?returnUrl=' + encodeURIComponent(window.location.pathname);
    } else if (xhr.status === 403) {
        toastr.error('You do not have permission to perform this action.');
    } else {
        const serverMessage = xhr.responseJSON && xhr.responseJSON.message;
        toastr.error(serverMessage || 'An unexpected error occurred. Please try again.');
    }
}
```

---

## Frontend Validation

### Standard Validation Pattern
```javascript
function validateForm() {
    const errors = [];

    // Required fields
    if (!$('#name').val().trim()) errors.push('Name is required.');
    if (!$('#startDate').val()) errors.push('Start date is required.');

    // Format checks
    if ($('#email').val() && !isValidEmail($('#email').val())) {
        errors.push('Invalid email format.');
    }

    // Business rules
    const start = moment($('#startDate').val());
    const end = moment($('#endDate').val());
    if (end.isBefore(start)) errors.push('End date must be after start date.');

    if (errors.length > 0) {
        // Static messages only — never join user input into this HTML (see Output Encoding)
        toastr.warning(errors.join('<br>'));
        return false;
    }
    return true;
}

function handleSubmit() {
    if (!validateForm()) return;
    // proceed with AJAX
}
```

### Reusable Validation Helpers
```javascript
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value) {
    return moment(value, 'YYYY-MM-DD', true).isValid();
}

function isPositiveNumber(value) {
    return !isNaN(value) && parseFloat(value) > 0;
}
```

---

## File Export (Hidden Form POST)

Use when exporting files (Excel, PDF) with complex filter parameters. GET requests have URL
length limits — hidden Form POST bypasses this and triggers browser download via `target: '_blank'`.
```javascript
$('#btnExport').click(() => {
    // Collect filters into a variable first (Store-Then-Bind)
    const filters = getFilterData();

    const $form = $('<form>', {
        action: apiUrlObj.exportExcel,  // Your export API URL
        method: 'POST',
        target: '_blank'                // Triggers browser download
    });

    // Append each filter as hidden input — skip null/empty values
    $.each(filters, (key, value) => {
        if (value !== null && value !== '') {
            $form.append($('<input>', { type: 'hidden', name: key, value: value }));
        }
    });

    // Submit then immediately remove from DOM
    $form.appendTo('body').submit().remove();
});
```

**Why this works:**
- Avoids URL length limits from complex multi-select filters
- `target: '_blank'` lets browser handle the file download naturally
- Form is removed from DOM immediately after submit — no side effects

---

## Loading State

Always show a loading indicator during AJAX calls to prevent double submission.
```javascript
function showLoading() {
    $('#btnSubmit').prop('disabled', true).text('Processing...');
}

function hideLoading() {
    $('#btnSubmit').prop('disabled', false).text('Submit');
}
```
