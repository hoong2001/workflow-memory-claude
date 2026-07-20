---
name: workspace-aspnet-mvc-frontend-standards
description: ASP.NET MVC frontend JavaScript standards using jQuery, Razor, and Web API 2.2. Use this skill whenever writing, reviewing, or modifying frontend JavaScript in an ASP.NET MVC project — including jQuery AJAX calls, form submissions, dropdown binding, Razor-to-JS data passing, frontend validation, file export, or page structure. Also trigger when the user asks about @Model, ViewBag, $.ajax(), JSON.stringify, contentType, Store-Then-Bind, hidden form POST, or any ASP.NET MVC frontend-backend data flow question. Do NOT use for Vue.js, React.js, or other SPA frameworks.
---

# Frontend Skill — ASP.NET MVC JavaScript Standards

> Single source of truth for **all frontend rules and how-to**. The project architecture doc (`workspace-project-stack-architecture.md`) owns only the stack versions and backend rules, and points here for everything frontend.

## Syntax Constraints (ES6 + CSS)

**JavaScript — Allowed ES6:**
- `let` / `const`, arrow functions, template literals
- Destructuring, spread operator, rest parameters
- Default parameters, object shorthand
- `Array.find()` / `findIndex()` / `includes()`
- `Object.assign()` / `Object.keys/values/entries`

**JavaScript — Forbidden:**
- `async` / `await` — use `$.ajax()` with callbacks
- IIFE — use namespace objects
- Promise — jQuery handles internally
- `class` syntax — use constructor functions or plain objects
- ES6 Modules (`import` / `export`) — use `<script>` tags
- Magic numbers / strings — use named constants

> **Note on examples in this skill:** the inline literals below (URLs like `/api/districts`, status codes `401`/`403`, messages, `'-- Select --'`) are illustrative only. In real code, extract them into named constants, a `CONFIG`/`PAGE_CONFIG` object, or an `apiUrlObj` — the "no magic numbers / strings" rule still applies.

**CSS — Allowed:** Bootstrap 3.4.1 and AdminLTE 2.x, CSS3 only.

**CSS — Forbidden:**
- CSS4+ features (`:has()`, `@layer`, `color-mix()`, container queries)
- CSS variables (`--custom-property`) — use Bootstrap 3 utility classes
- Flexbox `gap` — use margin/padding
- CSS Grid — use Bootstrap 3 grid (`col-xs-*`, `col-sm-*`, `col-md-*`, `col-lg-*`)

---

## Naming Conventions (JavaScript)

| Type | Convention | Example |
|------|-----------|---------|
| Constants | UPPER_SNAKE_CASE | `const MAX_PAGE_SIZE = 100;` |
| jQuery objects | `$` prefix | `const $button = $('#btn');` |
| Boolean variables | `is` / `has` / `can` prefix | `let isLoading = false;` |
| Arrays | Plural noun | `const regions = [];` |
| Functions | Verb + Noun | `function loadData() {}` |
| Event handlers | `handle` + Event | `function handleClick() {}` |
| Init functions | `init` + Component | `function initDataTable() {}` |

---

## Page Structure (Per-View JavaScript, Required Order)

| Section | Purpose |
|---------|---------|
| 1. CONSTANTS | CONFIG object, API URLs, named values |
| 2. MODULE-SCOPE VARIABLES | pageData, DataTable references, state flags |
| 3. INITIALIZATION | `$(document).ready()` → `initPage()` |
| 4. CONTROL INITIALIZATION | `initControls()`, `initDataTables()` |
| 5. EVENT HANDLERS | `bindEvents()`, `handleClick()`, `handleSubmit()` |
| 6. DATA COLLECTION & VALIDATION | `collectForm()`, `validateData()` |
| 7. AJAX & DATA PROCESSING | `loadData()`, `saveData()`, API calls |
| 8. UI BINDING | `bindDataToTable()`, `renderChart()` |
| 9. UTILITIES | `formatDate()`, `parseAmount()` |
| 10. CONFIGURATION FACTORIES | `getDataTableConfig()`, `getChartOption()` |

---

## Store-Then-Bind (Required, Both Directions)

The single rule behind the AJAX, validation, and export patterns below. Never bind directly from a response callback; never build a payload inline.

**Backend → Frontend (inbound):**
1. Receive AJAX response
2. Store `response.data` to a module-scope variable
3. Bind the variable to the UI

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

**Frontend → Backend (outbound):**
1. Collect form data into a named variable — a function-local `const` by default; promote it to module scope only when the payload must be re-read after the call (e.g. retry, debugging inspection)
2. Validate the collected variable (see *Frontend Validation Rules*)
3. Send it — by the method chosen per *Form Submit Rules* (AJAX POST for mutations, MVC Form GET for navigation, Hidden Form POST for export)

> Scope note: "Store-Then-Bind" governs **AJAX response data** and **outbound payloads**. Server values needed at page load are a separate concern — pass them via `data-*` attributes / an init block, never by reading Razor in JS logic (see *Razor → JavaScript Data Passing*). The outbound *implementation* is shown in *AJAX Standard Pattern*; this section is the principle.

---

## Data Flow Rule (Strict Separation)

**One source of truth per data type. No mixing.**

| Data Type | Method | Reason |
|-----------|--------|--------|
| Page init data (dropdowns, defaults, user info) | `@Model` / `ViewBag` | Rendered once on page load, no round trip needed |
| Search & query results | AJAX only | Dynamic, changes per user interaction |
| Save / Update / Delete | AJAX only | Requires response handling |
| Partial page updates | AJAX only | No full page reload |

❌ **Forbidden:**
- Using `@Model` to pass search results — bind via AJAX instead
- Mixing `ViewBag` and AJAX for the same data on the same page
- Reading Razor values in JS after page load (use `data-*` attributes instead)

---

## Razor → JavaScript Data Passing

When backend data must be available in JS on page load, use `data-*` attributes or a dedicated init block. Never scatter Razor expressions inside JS logic.

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

✅ **Correct — init block at top of script:**
```javascript
// Page init data from server
const PAGE_CONFIG = {
    userId: @Model.UserId,                                   // Numeric property — unquoted
    userName: '@Model.UserName',                             // String — must be quoted
    userList: @Html.Raw(Json.Encode(Model.Users)),           // Complex object/collection — JSON serialize
    defaultDate: '@DateTime.Today.ToString("yyyy-MM-dd")'    // Formatted date is a string — quoted
};
```

> Init block safety rules — **quoting is type-driven**:
> - **Numeric / boolean typed properties** — output unquoted: `userId: @Model.UserId`.
> - **String values** — always quoted: `userName: '@Model.UserName'`.
> - **Nullable / ViewBag values** — null-guard them: `@(ViewBag.UserId ?? 0)`. ViewBag is dynamic; a null renders as empty (`userId: ,`) and breaks the script with a JS syntax error.
> - **Complex objects / collections** — serialize to JSON: `@Html.Raw(Json.Encode(Model.Users))` (MVC 5 / .NET Framework API; `Json.Serialize` is the ASP.NET Core equivalent — do not use it here). Never hand-build object literals.
> - **External `.js` files** — Razor only executes inside `.cshtml`. Never put `@` expressions in a `.js` file; inject values into `data-*` attributes in the view and read them from the external script (the *pass via data attribute* pattern above).

❌ **Wrong — Razor mixed into JS logic:**
```javascript
function loadData() {
    $.ajax({ data: { id: @Model.Id } }); // Never do this
}
```

---

## Dropdown Binding Rules

Dropdowns are always initialized from `@Model` / `ViewBag` on page load.
Never fetch dropdown options via AJAX unless they are dependent (cascading).

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

## Control Initialization Patterns (Mandated Widgets)

The stack mandates these widgets for their jobs (see architecture doc §1.2). Standard init per widget — settings shown here are the required project defaults.

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

### Payload Rules (Mandatory)

1. **Always collect the payload into a named variable first** — never construct the object inline inside `$.ajax()`. A function-local `const` is the default; module scope only when the payload must be re-read after the call.
2. **`JSON.stringify()` + `contentType: 'application/json'` are mandatory for JSON bodies (POST/PUT)** — omitting either causes the backend to receive malformed data. **Exception: GET requests** — pass `data: { ... }` as a plain object so jQuery serializes it into the query string; never stringify a GET payload.

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

### Standard Response Format (Backend Contract)

All Web API responses must return this structure:
```json
{
    "success": true,
    "message": "Operation completed",
    "data": { }
}
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

## Output Encoding (XSS Prevention)

Any value that came from the server or the user is untrusted when it re-enters the DOM.

- **Bind data with `.text()`, never `.html()`** — the same applies to `$('<td>').text(value)` style construction.
- **DataTables**: use `columns.data` / text rendering; if a custom `render` builds HTML, escape every data value in it.
- **toastr / notification messages**: static strings or escaped values only — never concatenate raw user input or server data into the message HTML.
- When an HTML string must be built by hand, escape values through a shared helper (e.g. an `escapeHtml()` utility in section 9), not ad-hoc `.replace()` calls.

---

## Frontend Validation Rules

Validate before every AJAX submission. Backend validation is the safety net, not the first line of defence.

### Validation Order
1. Required fields — block empty submission
2. Format checks — dates, numbers, length
3. Business rules — date range logic, dependency checks
4. Submit → AJAX

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

## Form Submit Rules

| Scenario | Method |
|----------|--------|
| Simple page navigation with filters | MVC Form GET |
| Data mutation (save, update, delete) | AJAX POST |
| Partial update without page reload | AJAX |
| File upload | MVC Form POST with `enctype="multipart/form-data"` |
| File export with complex filters | Hidden Form POST (see below) |

❌ **Never use MVC Form POST for save/update/delete** — always use AJAX so errors can be handled without full page reload.

### File Export Pattern (Hidden Form POST)

Use this pattern when exporting files (Excel, PDF) with complex filter parameters.
GET requests have URL length limits — hidden Form POST bypasses this and triggers browser download via `target: '_blank'`.

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

## Loading State Rules

Always show loading indicator during AJAX calls to prevent double submission.

```javascript
function showLoading() {
    $('#btnSubmit').prop('disabled', true).text('Processing...');
}

function hideLoading() {
    $('#btnSubmit').prop('disabled', false).text('Submit');
}
```
