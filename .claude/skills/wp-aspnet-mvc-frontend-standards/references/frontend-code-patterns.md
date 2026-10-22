# Frontend Code Patterns — Copy-Ready Examples

> Companion to `SKILL.md`. The SKILL.md carries the **rules**; this file carries the
> **how-to** — one concrete, copy-ready example per rule. Section headings mirror SKILL.md
> so you can jump straight from a rule to its code.

---

## Store-Then-Bind

**Backend → Frontend (inbound):**
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

**DataTables:**
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

**Select2:**
```javascript
$('#regionSelect').select2({
    allowClear: true,
    width: '100%',
    placeholder: SELECT_PLACEHOLDER
});
```

**Bootstrap Datepicker:**
```javascript
$('.date-input').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true
});
```

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
                toastr.warning(escapeHtml(response.message));
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

```javascript
function handleAjaxError(xhr) {
    if (xhr.status === 401) {
        toastr.error('Session expired. Please login again.');
        window.location.href = LOGIN_URL + '?returnUrl=' + encodeURIComponent(window.location.pathname);
    } else if (xhr.status === 403) {
        toastr.error('You do not have permission to perform this action.');
    } else {
        const serverMessage = xhr.responseJSON && xhr.responseJSON.message;
        toastr.error(serverMessage ? escapeHtml(serverMessage) : 'An unexpected error occurred. Please try again.');
    }
}
```

---

## Output Encoding

toastr 2.1.4 renders its message as HTML (`escapeHtml` option defaults to `false`), so every server
or user value passes through this helper before it reaches toastr or a hand-built HTML string.

```javascript
// Section 9 (UTILITIES) — the one escape helper
function escapeHtml(value) {
    return $('<div>').text(value == null ? '' : String(value)).html();
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

---

## Loading State

```javascript
function showLoading() {
    $('#btnSubmit').prop('disabled', true).text('Processing...');
}

function hideLoading() {
    $('#btnSubmit').prop('disabled', false).text('Submit');
}
```
