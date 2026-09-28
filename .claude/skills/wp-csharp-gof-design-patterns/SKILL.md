---
name: wp-csharp-gof-design-patterns
description: GoF design-pattern standard for this C# 7.3 / .NET Framework stack — which patterns fit, the concrete pain that must exist before one is introduced, how each is shaped with no DI, and which patterns are banned or not worth it here. Use when designing or refactoring C# Service, ServBackend, or integration code (incl. the class map of /wp-module-technical-design) — a type-code switch repeated across methods, two classes running the same step sequence, a third-party library (RestSharp, NPOI, NDbfReader) called from several places, Worker.cs growing a second job — or when the user asks "which design pattern", "should this be a Strategy / Factory", "refactor this with a pattern", "設計模式", "重構設計". Use alongside wp-repository-unitofwork-pattern (owns the data-access layer) and project-memory/stack-architecture.md (owns what is forbidden), never instead of them. Do NOT use to add a pattern to code the task does not touch, or for frontend JavaScript (wp-aspnet-mvc-frontend-standards).
---

# C# Design Patterns

A pattern is a named fix for a pain that already exists. Introduced before the pain, it is an
abstraction with one caller, which `.claude/rules/workspace-reduce-coding-mistake.md` §2 forbids.
Every pattern below therefore carries a trigger. No trigger, no pattern: write the plain code.

## Scope — what this skill owns, and what it does not

| Concern | Owner |
|---|---|
| Which pattern, when to introduce it, how it is shaped in this stack | **this skill** |
| Repository, UnitOfWork, Dapper, Repository interfaces | `wp-repository-unitofwork-pattern` |
| What is forbidden (DI, async, interfaces, Generic Repository), C# version, layering | `project-memory/stack-architecture.md` |
| Whether logic lives in SQL or in the Service | `wp-sql-query-design` |

Never restate a rule from those three here. Point to them.

---

## The one rule: name the pain first

Before introducing a pattern, write one sentence that names the pain and points at the code:

> "The `switch (customerType)` in `PriceService.Calculate` and `InvoiceService.Build` must change
> together every time a customer type is added."

If you cannot write that sentence, the pattern does not belong. If you can, it goes into the
plan's Touch points (or Technical Design) and into the impl record's **Decisions + why** — a
future session that wants to remove the pattern needs to know what it was for.

## How this stack shapes every pattern

- **No DI → objects are created with `new`, in one place:** the Factory, or the Service that owns
  the pattern. Never a static registry or service locator standing in for a container.
- **The family's abstraction is an abstract base class.** C# 7.3 has no default interface methods,
  so shared step code can only live in a base class, and the Base-class convention in
  `stack-architecture.md` §2.3 already makes that the house shape. Use an interface only for a
  layer where `stack-architecture.md` §4.1 explicitly permits one — or where the module already
  uses interfaces for the same kind of thing (its `MODULE.md` Local conventions, or the existing
  code): brownfield code follows the local style.
- **Every class in the Services project inherits `BaseService`** — §2.3 says "no exceptions", and
  C# allows one parent class. So a pattern family's base class inherits `BaseService`
  (`DiscountRuleBase : BaseService`), and its members reach it through that base.
  With a parameterless `BaseService` constructor (the usual case) subclasses pass nothing up; if a
  project's takes parameters, the family base passes them through once. A C# `static`
  class cannot inherit anything, so a Factory is a regular class the Service `new`s.
- **A pattern class that is not itself a Service holds no UnitOfWork and runs no SQL.** The owning
  Service loads the data and passes it in; the Strategy only decides. A class that needs data
  access is a Service (Template Method across two export Services), and follows every Service rule.
- **Placement: the same folder as the Service that owns it.** Never a new folder such as
  `Services/Strategies/` — the structure in `stack-architecture.md` §3 stays as it is. ServBackend
  jobs sit in the ServBackend project beside `Worker.cs`; that project has no mandatory base class
  in §2.3, so a job inherits only its own family's base.
- **Synchronous, and no mutable static state.** IIS serves requests in parallel; a static field
  that changes is a race.
- **C# 7.3 syntax:** a `switch` statement, never a switch expression; `is` type patterns and
  expression-bodied members are fine.

Code samples below show the shape only. Before writing a real third-party call, verify it per
`.claude/rules/workspace-library-docs-first.md`.

---

## Recommended patterns

### 1. Template Method — same steps, one or two differ

**Trigger:** two or more classes run the same sequence of steps and differ in one or two of them.
Typical cases are two NPOI exports, or two imports that read a DBF or Excel file, validate the
rows, then save.

```csharp
public abstract class ExcelExportServiceBase<TRow> : BaseService where TRow : BaseResult
{
    // The fixed sequence. Not virtual: subclasses fill in steps, never reorder them.
    public byte[] Export(ExportRequestResult request)
    {
        var rows = LoadRows(request);
        var workbook = new XSSFWorkbook();
        var sheet = workbook.CreateSheet(SheetName);
        WriteHeader(sheet);
        WriteRows(sheet, rows);
        return ToBytes(workbook);
    }

    protected abstract string SheetName { get; }
    protected abstract IList<TRow> LoadRows(ExportRequestResult request);
    protected abstract void WriteHeader(ISheet sheet);
    protected abstract void WriteRows(ISheet sheet, IList<TRow> rows);

    private byte[] ToBytes(IWorkbook workbook) { ... }
}
```

**Stop sign:** more than four abstract steps, or a subclass that needs a different sequence. The
classes do not share a shape, so keep them separate.

### 2. Strategy + 3. Simple Factory — one rule per type, chosen in one place

The two travel together. Strategy splits the branches; with no DI, the Factory is the one place
that decides which branch to `new`.

**Trigger:** the same `switch` or if-chain on a type code appears in a second method, or one
branch grows past about 15 lines of its own rules. A single short `switch` in one method stays a
`switch`.

```csharp
// In the Services project, so the family base inherits BaseService (§2.3)
public abstract class DiscountRuleBase : BaseService
{
    public abstract decimal Apply(OrderResult order);

    protected decimal RoundToCent(decimal amount)
        => Math.Round(amount, 2, MidpointRounding.AwayFromZero);
}

public class MemberDiscountRule : DiscountRuleBase
{
    public override decimal Apply(OrderResult order) { ... }
}

public class StockistDiscountRule : DiscountRuleBase
{
    public override decimal Apply(OrderResult order) { ... }
}

// The only place that news up the family. Not a static class: a static class cannot
// inherit BaseService.
public class DiscountRuleFactory : BaseService
{
    public DiscountRuleBase Create(string customerType)
    {
        switch (customerType)
        {
            case CustomerTypes.MEMBER:   return new MemberDiscountRule();
            case CustomerTypes.STOCKIST: return new StockistDiscountRule();
            default:
                throw new ArgumentOutOfRangeException(nameof(customerType), customerType,
                    "No discount rule for this customer type");
        }
    }
}

// In the owning Service
var rule = new DiscountRuleFactory().Create(order.CustomerType);
order.Discount = rule.Apply(order);
```

- The factory and the strategies hold no state, so they are safe under IIS, and a new instance
  per call costs nothing.
- `default` throws. A factory that silently returns a do-nothing rule hides a missing type until
  the numbers are wrong.
- The type codes live in `ConstValues/` (`stack-architecture.md` §2.4).

**Stop sign:** a Strategy family with one implementation. Delete the base class and inline it.

### 4. Adapter — keep a third-party library behind one class

**Trigger:** a third-party library (RestSharp, NPOI, NDbfReader) is called directly from a second
Service, or every call site repeats the same setup — base URL, headers, timeout, error mapping.

Shape: one concrete class per external system or library use, in the Services project, exposing
business-shaped methods that take and return Result classes. Library types never leak out of it.
The pinned version's API then lives in one file, so an upgrade touches one file.

```csharp
public class PaymentGatewayClient : BaseService
{
    private readonly RestClient _client;

    public PaymentGatewayClient(string baseUrl)
    {
        _client = new RestClient(baseUrl);
    }

    public PaymentStatusResult GetPaymentStatus(string paymentReference)
    {
        var request = new RestRequest("payments/{reference}", Method.GET);
        request.AddUrlSegment("reference", paymentReference);

        var response = _client.Execute<PaymentStatusResult>(request);
        if (!response.IsSuccessful)
            throw new InvalidOperationException("Payment gateway returned " + response.StatusCode);

        return response.Data;
    }
}
```

The base URL and any credential come from `Web.config`, read by the Service that creates the
client — never written into code or docs (`.claude/rules/workspace-no-secrets.md`).

**Stop sign:** wrapping a .NET Framework type (`File`, `DateTime`, `SqlConnection`). Only third-party
libraries get an Adapter; the data layer belongs to `wp-repository-unitofwork-pattern`.

### 5. Command — one class per ServBackend job

**Trigger:** `Worker.cs` holds a second scheduled job, or one job's body grows past about 30 lines.

```csharp
public abstract class BackendJobBase
{
    public abstract string JobName { get; }
    public abstract bool IsDue(DateTime now);
    public abstract void Run();
}

// In Worker.cs: it dispatches and knows nothing about what a job does
private readonly List<BackendJobBase> _jobs = new List<BackendJobBase>
{
    new StockSyncJob(),
    new DailyReportJob()
};

private void RunDueJobs(DateTime now)
{
    foreach (var job in _jobs.Where(j => j.IsDue(now)))
    {
        try
        {
            job.Run();
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Backend job failed: " + job.JobName);
        }
    }
}
```

- One failing job is logged and does not stop the others.
- A job calls `Services.Backend` Services, never a Repository directly (`stack-architecture.md` §2.2).

---

## Conditional — only when the named condition holds

| Pattern | Only when | Otherwise |
|---|---|---|
| State | An entity has five or more states, the allowed transitions differ per state, and the transition checks are scattered across two or more Services | An enum plus one `CanMoveTo(...)` method in the owning Service |
| Chain of Responsibility | Five or more validation rules that callers reorder or switch on and off | A plain sequence of `Validate...` calls collecting errors into one list |
| Builder | A complex NPOI sheet (merged headers, row groups, styles) shared by two or more exports | Direct NPOI calls. Never for SQL — dynamic queries follow `wp-repository-unitofwork-pattern` |

## Not in this stack

| Pattern | Why not |
|---|---|
| Singleton holding a connection, a UnitOfWork, or any mutable state | IIS runs requests in parallel and recycles the app pool; shared state is a race, and a shared connection breaks UnitOfWork's lifetime. Allowed: a `static readonly` immutable lookup, or `Lazy<T>` over read-only config |
| Generic Repository, Specification | Forbidden by `stack-architecture.md` §4.1 |
| Mediator (MediatR style) | Only pays off with DI, which is forbidden |
| Decorator / Proxy around a Repository | Possible once Repository interfaces are allowed, but the concerns it would add (logging, timing) belong in `BaseRepository` or the Service's NLog call — one place, not a wrapper per Repository |
| Abstract Factory, Visitor, Prototype, Flyweight, Memento, Interpreter | No problem in a synchronous CRUD MVC system that these solve |
| Observer between Web and ServBackend | The two are separate processes that share no memory; in-process events cannot connect them |

---

## Refactoring existing code into a pattern

- **Only code the current task touches.** A trigger spotted in untouched code goes into the report
  as one line; the code stays as it is (`workspace-reduce-coding-mistake.md` §3, brownfield mode in
  `stack-architecture.md` §0).
- **Shared symbol → list its callers first**, from the fan-in table in `<name>-flow.md`, or by
  running `/wp-module-code-trace-flow`. Every caller must compile and behave the same afterwards.
- **A refactor is its own Tasks row**, never mixed with a behavior change. Its done-criterion is
  "same observable behavior before and after", and the user builds and tests it (manual, per
  `workspace-workflow.md` Step 2).

This skill applies inside a coding task and adds no handoff of its own; that task's handoff covers
it (`.claude/skills/_shared-conventions.md` → Handoff).

## Review checklist

- [ ] Every pattern has its one-sentence pain in the plan or impl record
- [ ] No pattern family with a single implementation
- [ ] Objects are created in the Factory or the owning Service, not scattered `new`s
- [ ] The family abstraction is an abstract base class; an interface only where §4.1 permits it
      or the module already uses one for the same kind of thing
- [ ] Every class in the Services project inherits `BaseService`, directly or through its family base
- [ ] Pattern classes that are not Services hold no UnitOfWork and run no SQL
- [ ] No new folder — pattern classes sit beside the Service that owns them
- [ ] No mutable static state
- [ ] No third-party type leaks past its Adapter
- [ ] C# 7.3 syntax only
