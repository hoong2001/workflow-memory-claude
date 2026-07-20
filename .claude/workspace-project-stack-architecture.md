# Project Stack & Architecture

> Single source of truth for development environment, tooling, and standards.

---

## 0. Adoption Mode

> This document is PRESCRIPTIVE (it governs code Claude will WRITE), not descriptive
> (it is never an inventory of existing code). Set **Current mode** per project.

- **greenfield** — new system built on this stack from day one. Hard rules apply to ALL code.
- **brownfield-conformant** — existing system verified (by the conformance scan below) to
  already follow this stack. Hard rules apply to ALL code; keep this file as-is.
- **brownfield** — existing system with a different or mixed architecture. Hard rules govern
  NEW code only. When modifying existing code, match local style; never rewrite old code to
  satisfy these rules unless explicitly asked. Module-level deviations are recorded in that
  module's `MODULE.md` (Local conventions / Known gotchas) as you touch them — never here,
  and never via an up-front whole-system survey. Exception: security-critical rules
  (e.g. parameterized SQL) apply to ALL code, old and new.

**Conformance scan** (run ONCE when adopting this framework on an existing system) →
procedure in `.claude/adoption-conformance-scan.md` (read on demand at adoption time).

**Current mode:** greenfield

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
| DataTables | 2.0.7 | Tabular data | ALL tabular data |
| ECharts | 6.0.0 | Data visualization | ALL charts and graphs |
| Bootstrap Datepicker | 1.10.0 | Date input fields | ALL date inputs |
| Select2 | 4.0.13 | Enhanced select | ALL select boxes |
| moment.js | 2.30.1 | Date/time formatting | ALL date formatting |
| Toastr | 2.1.4 | User notifications | ALL notifications |

### 1.3 Deployment

| Component | Version | Purpose |
|-----------|---------|---------|
| OS | Windows Server 2022 | Server operating system |
| Web Server | IIS 10 | Web application server |

---

## 2. Architecture

### 2.1 Layers & Responsibilities

The solution follows a classic layered architecture. Each project maps to exactly one layer. Never mix responsibilities across projects.

| Layer | Project | Responsibility |
|-------|---------|---------------|
| Presentation | [Name].Web | MVC/Web API controllers (route to Service — no business logic, no data access), Razor views, ViewModels |
| Business Logic | [Name].Services | All business logic, shared by Web and ServBackend — no direct data access, no UI concerns |
| Data Access | [Name].UnitOfWork | Repositories (SQL via Dapper only — no business logic); UnitOfWork owns transactions (`Commit()` / `Rollback()`) and DB connection lifetime |
| Windows Service | [Name].ServBackend | Background workers, scheduled jobs — depends on Services + UnitOfWork |

### 2.2 Dependency Direction

Dependencies flow strictly downward. No layer may reference a layer above it.

```
Web  ──►  Services  ──►  UnitOfWork  ──►  SQL Server
ServBackend  ──►  Services  ──►  UnitOfWork  ──►  SQL Server
```

> Web and ServBackend are independent entry points. Neither knows the other exists.

### 2.3 Base Classes

Every layer has a mandatory Base class. All concrete classes must inherit from it — no exceptions.

| Base Class | Location | Mandatory? | Purpose |
|------------|----------|------------|---------|
| `BaseService` | `Services/` | Yes — ALL Services (shared, Web, Backend) | Shared properties and common helper methods across all service types |
| `BaseRepository` | `UnitOfWork/Repositories/` | Yes — all Repositories | DB connection, shared Dapper execute helpers |
| `BaseResult` | `UnitOfWork/Results/` | Yes — all Result classes | Shared properties to avoid duplication across Result classes |

> Base class contents evolve during development — the rule is that they exist and are inherited, not what specific members they contain.

### 2.4 Data Model: Result Objects

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
│   ├── Models/                    ← ViewModels
│   ├── Scripts/                   ← JavaScript files
│   ├── Content/                   ← CSS, images
│   └── App_Start/                 ← Route, bundle config
│
├── [ProjectName].Services         ← Business Logic Layer
│   ├── Web/                       ← Web-only services (namespace: Services.Web)
│   │   └── [Entity]Service.cs
│   ├── Backend/                   ← Backend-only services (namespace: Services.Backend)
│   │   └── [Entity]Service.cs
│   ├── BaseService.cs
│   └── [Entity]Service.cs        ← Shared services
│
├── [ProjectName].UnitOfWork       ← Data Access Layer
│   ├── ConstValues/                ← Shared constants and Enums
│   ├── Repositories/              ← Repository classes, organised by Entity
│   │   ├── BaseRepository.cs
│   │   └── [Entity]Repository.cs
│   ├── Results/                    ← Result objects
│   │   ├── BaseResult.cs
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

> Frontend coding rules (allowed/forbidden ES6 features, CSS constraints) **and** all frontend how-to patterns live in the **`workspace-aspnet-mvc-frontend-standards`** skill — the single source of truth for frontend. This architecture doc owns only the stack versions (§1.2) and the backend rules above.

### 4.3 Code Quality

- ✔ KISS — keep it simple and readable
- ✔ DRY — no duplicated logic across projects
- ✔ All comments in English

---

## 5. Naming Conventions

### 5.0 Universal Naming Principles (ALL languages — C#, JavaScript, SQL, anything)

These apply regardless of language; the per-language casing rules below only refine *how* to spell them.

- ✔ **Self-descriptive, no cryptic shorthand** — the name alone says what a method *does* or a variable *holds*: `GetActiveCustomersByRegion`, not `GetData2`; `errorMessage`, not `errMsg`. Exceptions: a conventional loop index (`i`, `j`) in a short loop; domain-standard acronyms (`Id`, `Url`, `Html`, `Sql`).
- ✔ **Length ≤ 50 characters** — a hard cap. If a name approaches 50 chars, the method/variable is usually doing too much — reconsider the design, don't truncate into cryptic shorthand.

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

> Frontend (JavaScript) naming conventions, Store-Then-Bind, and the per-view JS structure → **`workspace-aspnet-mvc-frontend-standards`** skill.