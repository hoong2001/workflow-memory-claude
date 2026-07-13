# Project Stack & Architecture

> Single source of truth for development environment, tooling, and standards.

---

## 1. Technology Stack

### 1.1 Backend

| Component | Version | Purpose | Usage |
|-----------|---------|---------|-------|
| IDE | Visual Studio 2017 Professional | Development environment | |
| Language | C# 7.3 | Backend language (no newer syntax) | |
| Framework | ASP.NET MVC 5, Web API 2.2 | Web framework | |
| Runtime | .NET Framework 4.7.2 | Runtime environment | |
| Database | SQL Server 2022 | Database server | |
| Dapper.NET | 1.50.5 | Data access | `Query<T>`, `Execute`, `QueryFirstOrDefault<T>` |
| RestSharp | 106.15.0 | External API calls | |
| NPOI | 2.6.2 | Excel file generation | |
| Npoi.Mapper | 6.2.1 | Excel object mapping | |
| Humanizer | 2.14.1 | String/date humanization | |
| NLog | 6.1.1 | Exception logging | |
| NLog.Targets.Mail | 6.1.1 | Email notification via NLog | Required for NLog email alerts |
| Newtonsoft.Json | 12.0.3 | JSON serialization / deserialization | |
| NDbfReader / NDbfReaderEx | 2.4.0 / 1.4.1.1 | DBF file reading | |

### 1.2 Frontend

| Component | Version | Purpose | Usage |
|-----------|---------|---------|-------|
| Bootstrap | 3.4.1 | UI styling | ALL UI layout and components |
| AdminLTE | v2.4.18 | Admin panel layout | Admin panel layout and widgets |
| Markup | HTML5 | Page structure | |
| JavaScript | ES6 (limited) | Frontend logic | |
| jQuery | 3.6 | DOM manipulation & AJAX | ALL DOM manipulation and AJAX calls |
| DataTables | 2.0.7 | Tabular data | ALL tabular data — `pageLength: 25`, `responsive: true` |
| ECharts | 6.0.0 | Data visualization | ALL charts and graphs |
| Gijgo | 1.9.13 | Date picker (alternative) | |
| Bootstrap Datepicker | 1.10.0 | Date input fields | ALL date inputs — `format: 'yyyy-mm-dd'`, `autoclose: true` |
| Select2 | 4.0.13 | Enhanced select | ALL select boxes — `allowClear: true`, `width: '100%'` |
| moment.js | 2.30.1 | Date/time formatting | ALL date formatting — `moment(date).format('YYYY-MM-DD')` |
| Toastr | 2.1.1 | User notifications | ALL notifications — `.success()` `.info()` `.warning()` `.error()` |

### 1.3 Deployment

| Component | Version | Purpose |
|-----------|---------|---------|
| OS | Windows Server 2022 | Server operating system |
| Web Server | IIS 10 | Web application server |

---

## 2. Architecture

### 2.1 Layer Overview

The solution follows a classic layered architecture. Each project maps to exactly one layer. Never mix responsibilities across projects.

| Layer | Project | Responsibility |
|-------|---------|---------------|
| Presentation | [Name].Web | MVC controllers, Razor views, ViewModels, Web API controllers |
| Business Logic | [Name].Services | All shared business logic — used by both Web and ServBackend |
| Data Access | [Name].UnitOfWork | Repository implementations, Dapper queries, transaction control |
| Windows Service | [Name].ServBackend | Background workers, scheduled jobs — depends on Services + UnitOfWork |

### 2.2 Dependency Direction

Dependencies flow strictly downward. No layer may reference a layer above it.

```
Web  ──►  Services  ──►  UnitOfWork  ──►  SQL Server
ServBackend  ──►  Services  ──►  UnitOfWork  ──►  SQL Server
```

> Web and ServBackend are independent entry points. Neither knows the other exists.

### 2.3 Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| Controller | Route requests to Service — no business logic, no data access |
| Service | Business logic only — no direct data access, no UI concerns |
| Repository | Data access only — SQL queries via Dapper, no business logic |
| UnitOfWork | Transaction control: `Commit()` / `Rollback()`, owns DB connection lifetime |

### 2.4 Base Classes

Every layer has a mandatory Base class. All concrete classes must inherit from it — no exceptions.

| Base Class | Location | Mandatory? | Purpose |
|------------|----------|------------|---------|
| `BaseService` | `Services/` | Yes — ALL Services (shared, Web, Backend) | Shared properties and common helper methods across all service types |
| `BaseRepository` | `UnitOfWork/Repositories/` | Yes — all Repositories | DB connection, shared Dapper execute helpers |
| `BaseResult` | `UnitOfWork/Results/` | Yes — all Result classes | Shared properties to avoid duplication across Result classes |

> Base class contents evolve during development — the rule is that they exist and are inherited, not what specific members they contain.

### 2.5 Data Model: Result Objects

Dapper query results are wrapped in Result classes. There are no separate DTO or Entity layers.

| Location | Purpose |
|----------|---------|
| `UnitOfWork/Results/` | Result classes shared across Repository methods — a single class (e.g. `StockistResult`) may be reused by multiple queries |
| `UnitOfWork/ConstValues/` | Shared constants and Enums — accessible to all projects via existing UnitOfWork reference |
| `Web/Models/` | ViewModels for MVC views — UI-bound, NOT shared with ServBackend |

> Reuse an existing Result class where possible — a single class may cover multiple Repository methods.

---

## 3. Solution Structure

```
[YourSolution].sln
│
├── [ProjectName].Web              ← Presentation Layer (MVC 5)
│   ├── ApiControllers/            ← Web API 2.2 controllers
│   ├── Controllers/               ← MVC controllers
│   ├── Views/                     ← Razor views
│   ├── Models/                    ← ViewModels (Web-only, not shared)
│   ├── Scripts/                   ← JavaScript files
│   ├── Content/                   ← CSS, images
│   └── App_Start/                 ← Route, bundle config
│
├── [ProjectName].Services         ← Business Logic Layer
│   ├── Web/                       ← Web-only services (namespace: Services.Web)
│   │   └── [Entity]Service.cs     ← inherits BaseService
│   ├── Backend/                   ← Backend-only services (namespace: Services.Backend)
│   │   └── [Entity]Service.cs     ← inherits BaseService
│   ├── BaseService.cs             ← Base — ALL Services must inherit
│   └── [Entity]Service.cs        ← Shared services, inherits BaseService
│
├── [ProjectName].UnitOfWork       ← Data Access Layer
│   ├── ConstValues/                ← Shared constants and Enums
│   ├── Repositories/              ← Repository classes, organised by Entity
│   │   ├── BaseRepository.cs      ← Base — all Repositories must inherit
│   │   └── [Entity]Repository.cs
│   ├── Results/                    ← Result objects (shared across Repository methods)
│   │   ├── BaseResult.cs          ← Base — all Result classes must inherit
│   │   └── [Entity]Result.cs
│   └── UnitOfWork.cs              ← Implements IDisposable
│
└── [ProjectName].ServBackend      ← Windows Service
    └── Worker.cs                  ← Background job entry point
```

### 3.1 Where to Put Logic — Decision Rule

| Logic type | Where it lives |
|------------|---------------|
| Shared business rules (Web AND ServBackend) | `[Name].Services/[Entity]Service.cs` : `BaseService` |
| Web-only business logic | `[Name].Services/Web/[Entity]Service.cs` : `BaseService` |
| Backend-only business logic | `[Name].Services/Backend/[Entity]Service.cs` : `BaseService` |
| Database queries and result shaping | `[Name].UnitOfWork/Repositories/[Entity]Repository.cs` : `BaseRepository` |
| Query result / reusable data objects | `[Name].UnitOfWork/Results/[Entity]Result.cs` : `BaseResult` |
| Shared constants and Enums | `[Name].UnitOfWork/ConstValues/` |
| MVC ViewModels (UI-bound) | `[Name].Web/Models/` |

> Repository is split by Entity, never by entry point. The same `OrderRepository` may be used by both Web and ServBackend.

---

## 4. Constraints & Forbidden Patterns

### 4.1 Backend (C#)

**Required:**
- ✔ Repository + Unit of Work pattern
- ✔ Parameterized SQL queries (prevent SQL injection)
- ✔ Explicit transaction control via UnitOfWork
- ✔ Concrete class dependencies — no interfaces on Repository or UnitOfWork
- ✔ Dapper (micro-ORM) as the sole data-access library — raw, parameterized SQL only
- ✔ C# 7.3 syntax maximum

**Forbidden:**
- ✘ Dependency Injection (DI)
- ✘ Generic Repository
- ✘ Async / Await
- ✘ Entity Framework, or any heavy/full ORM with change-tracking, lazy-loading, or LINQ-to-SQL translation — Dapper.NET (micro-ORM) is the only permitted data-access library
- ✘ C# syntax newer than 7.3
- ✘ DTO or Entity layers — use Result objects only

### 4.2 Frontend (JavaScript & CSS)

> Frontend coding rules (allowed/forbidden ES6 features, CSS constraints) **and** all frontend how-to patterns live in the **`asp.net-mvc-frontend-standards`** skill — the single source of truth for frontend. This architecture doc owns only the stack versions (§1.2) and the backend rules above.

### 4.3 Code Quality

- ✔ KISS — keep it simple and readable
- ✔ DRY — no duplicated logic across projects
- ✔ All comments in English

---

## 5. Naming Conventions

### 5.0 Universal Naming Principles (ALL languages — C#, JavaScript, SQL, anything)

These apply regardless of language; the per-language casing rules below only refine *how* to spell them.

- ✔ **Human-readable** — a person can read the name and understand it without decoding abbreviations or guessing.
- ✔ **Self-descriptive** — the name alone tells you what a method *does* or what a variable *holds*. `GetActiveCustomersByRegion`, not `GetData2`; `unpaidInvoiceCount`, not `cnt`.
- ✔ **Length ≤ 50 characters** — a hard cap. Be descriptive, but if a name approaches 50 chars, it usually means the method/variable is doing too much — reconsider the design, don't just truncate into cryptic shorthand.
- ✘ No single-letter or cryptic names (`d`, `tmp`, `x1`) except a conventional loop index (`i`, `j`) in a short, obvious loop.
- ✘ No abbreviations that aren't universally understood — prefer `errorMessage` over `errMsg`, `customer` over `cust`. Domain-standard acronyms (`Id`, `Url`, `Html`, `Sql`) are fine.

> The test: a teammate with no context reads the name and knows roughly what it is. If they'd have to open the definition to find out, rename it.

### 5.1 Backend (C#)

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase, noun | `ProductRepository`, `OrderService` |
| Methods | PascalCase, verb | `GetCustomerById`, `SaveOrder` |
| Parameters / Variables | camelCase | `customerId`, `orderItems` |
| Private fields | `_camelCase` | `_unitOfWork`, `_connectionString` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Repositories | `[Entity]Repository` | `CustomerRepository` |
| Services | `[Entity]Service` | `ProductService` |

> Frontend (JavaScript) naming conventions, Store-Then-Bind, and the per-view JS structure → **`asp.net-mvc-frontend-standards`** skill.