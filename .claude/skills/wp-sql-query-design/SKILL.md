---
name: wp-sql-query-design
description: SQL query design standard for this stack — decides what belongs in SQL versus the C# Service layer via the row-count test, bans SELECT *, and keeps the SQL that remains simple, readable, and maintainable. Use whenever writing or reviewing any SQL: a query inside a Repository method, a .sql schema or seed script, a persisted test script. Also trigger when deciding where a calculation or rule should live, simplifying a query that has grown hard to follow, judging whether a performance rewrite is worth its readability cost, or on questions about GROUP BY vs LINQ, N+1 queries, paging, CASE expressions in SQL, window functions, CTE vs temp table, or "should this be in the query or in the service". Use alongside wp-concrete-repository-pattern (which owns the C# plumbing around the query — DynamicParameters, UnitOfWork, Dapper method choice) and the workspace-sql-house-style rule (which owns .sql-file conventions such as plain-INSERT seed scripts), never instead of them.
---

# SQL Query Design

Applies to every piece of SQL this project writes — a Repository query, a `.sql` schema or seed
script, a persisted test script. A one-line `SELECT` clears these rules in one pass; a report
query is where they earn their keep.

Readability and maintainability rank above query cleverness. A query that a teammate reads
once and understands is worth more than one that shaves 40ms off a page nobody complained
about. Performance still matters — this skill says when it is allowed to cost you clarity,
and demands evidence before it does.

## Scope — what this skill owns, and what it does not

| Concern | Owner |
|---|---|
| What the query should do, how simple it should be, where logic lives | **this skill** |
| `DynamicParameters`, UnitOfWork, BaseRepository, dynamic WHERE assembly, `WHERE IN`, Dapper method choice, parameterization | `wp-concrete-repository-pattern` |
| `.sql`-file conventions — plain-INSERT seeds, read the real definition first, ship it as a real file | `workspace-sql-house-style.md` rule |
| Stack versions, layering, forbidden patterns | `project-memory/stack-architecture.md` |

Never restate a rule from those three here. Point to them.

The readability rules below apply to `.sql` files too — a seed or schema script gets the same
explicit column lists and the same ban on `SELECT *`. The house-style rule owns what is
special about `.sql` files; this skill owns what every piece of SQL has in common.

---

## The one rule: the row-count test

> **Keep work in SQL when moving it to C# would send more rows across the connection.
> Move it to C# when it would not.**

The test is objective, so two people applying it reach the same answer. It also happens to
put the database engine on exactly the work it is better at — reducing a result set — and
leaves the reasoning about that result set to a language you can debug and unit-test.

Ordering is the one addition the test does not cover: keep `ORDER BY` in SQL even without
paging, because an index supplies order for free and the C# sort would be pure waste.

### Where each kind of logic belongs

| Work | Where | Why |
|---|---|---|
| `WHERE` filtering | SQL | Fewer rows returned |
| `JOIN` | SQL | The set operation the engine exists for |
| `GROUP BY` + `SUM`/`COUNT`/`MAX` | SQL | 2000 detail rows become 20 |
| `ORDER BY` | SQL | The index already provides it |
| Paging (`OFFSET`/`FETCH`) | SQL | Fewer rows returned |
| `DISTINCT` on a real duplicate | SQL | Fewer rows returned |
| Business rules — discount tiers, credit scoring, status derivation, eligibility | C# Service | Row count unchanged; needs tests and a readable name |
| Display formatting — date strings, name concatenation, currency, unit labels | C# Service or ViewModel | Row count unchanged; presentation is not the database's job |
| Reshaping rows already fetched — grouping a joined result into parent/child objects | C# Service | Row count unchanged; the query already ran |
| Orchestration across repositories | C# Service | Crosses aggregate boundaries the query cannot see |

The last two rows matter most. Grouping in C# is forbidden when it replaces a `GROUP BY`
that would have shrunk the payload, and correct when it reshapes rows a single query
already returned. Same operation, opposite verdict — the row count decides.

### Applying the rule

```sql
-- ✅ SQL: every clause here reduces what crosses the wire
SELECT o.OrderId,
       o.OrderDate,
       o.Status,
       SUM(oi.Qty * oi.Price) AS SubTotal
FROM Orders o
INNER JOIN OrderItems oi ON oi.OrderId = o.OrderId
WHERE o.CustomerId = @CustomerId
  AND o.OrderDate >= @DateFrom
GROUP BY o.OrderId, o.OrderDate, o.Status
ORDER BY o.OrderDate DESC
OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY
```

```csharp
// ✅ C#: rules and presentation, on the 20 rows the query returned
foreach (var order in orders)
{
    order.DiscountTier = GetDiscountTier(order.SubTotal);
    order.IsOverdue    = order.Status == OrderStatus.Unpaid
                      && order.OrderDate < DateTime.Today.AddDays(-30);
}
```

Putting `GetDiscountTier` into a SQL `CASE` returns the same 20 rows, so the row-count test
sends it to C#, where it gets a name, a test, and one place to change when Finance revises
the thresholds.

---

## N+1: the rule's most common violation

A loop that calls a Repository method is the row-count test failing in the other direction —
one query becomes 200, and the fix belongs in SQL.

```csharp
// ❌ 1 + N queries
var orders = _uow.OrderRepository.GetByCustomer(customerId);
foreach (var o in orders)
    o.Items = _uow.OrderItemRepository.GetByOrder(o.OrderId);
```

```csharp
// ✅ One round trip, reshaped in C#
var rows = _uow.OrderRepository.GetWithItemsByCustomer(customerId);
var orders = rows.GroupBy(r => r.OrderId)
                 .Select(g => new OrderResult
                 {
                     OrderId   = g.Key,
                     OrderDate = g.First().OrderDate,
                     Items     = g.Select(ToItem).ToList()
                 })
                 .ToList();
```

For a parent list plus a child list that do not flatten cleanly, `QueryMultiple` returns both
sets in one round trip — see `wp-concrete-repository-pattern` for the call itself.

**Review trigger:** any `foreach` whose body reaches `_uow`. Check every one.

---

## Keep the query readable

### `SELECT *` is banned — no exceptions

```sql
-- ❌ Never. Not in a quick query, not in a dynamic template, not "just for now"
SELECT * FROM Products WHERE IsActive = 1

-- ✅ The query states its own contract
SELECT ProductID, ProductName, Price, CategoryID, IsActive
FROM Products
WHERE IsActive = 1
```

The ban is absolute because the failure is silent: add a column to the table and every
`SELECT *` starts hauling it across the wire, the Result class quietly stops matching what the
query returns, and nothing errors. The column list is also the only place a reader learns
which columns a Result class actually needs.

This includes the `{PLACEHOLDER}` templates of the dynamic query pattern — write the column
list into the template, not `*`.

### One query, one purpose

A Repository method returns one shaped result for one caller's need. When a query grows a
second purpose — extra columns only one caller reads, a flag parameter that switches its
shape — split it into two methods. Two clear queries beat one query with a mode switch.

### Name every computed column

```sql
-- ❌ Column1 in the Result class, and nobody knows why
SELECT ProductID, Price * Qty FROM OrderItems

-- ✅
SELECT ProductID, Price * Qty AS LineTotal FROM OrderItems
```

### Flatten nesting with a CTE

Nested subqueries read inside-out. A CTE reads top-to-bottom, and SQL Server 2022 costs you
nothing for it.

```sql
-- ❌ Read the middle first, then outward
SELECT c.CustomerName, t.OrderCount
FROM Customers c
INNER JOIN (SELECT CustomerId, COUNT(*) AS OrderCount
            FROM Orders WHERE Status = @Status GROUP BY CustomerId) t
    ON t.CustomerId = c.CustomerId
WHERE t.OrderCount > @MinOrders

-- ✅ Read top to bottom
WITH OrderCounts AS (
    SELECT CustomerId, COUNT(*) AS OrderCount
    FROM Orders
    WHERE Status = @Status
    GROUP BY CustomerId
)
SELECT c.CustomerName, oc.OrderCount
FROM Customers c
INNER JOIN OrderCounts oc ON oc.CustomerId = c.CustomerId
WHERE oc.OrderCount > @MinOrders
```

Stop at two CTEs. A third is usually two Repository methods, or work that belongs in C#.

**Reference a CTE once.** A non-recursive CTE in SQL Server is an inline view, not a stored
result — the optimizer expands its definition at every reference point, so referencing it
twice can run the underlying query twice. (It may insert a spool to reuse the result, but that
is its choice, not a guarantee.) Referenced once, a CTE and a subquery produce the identical
plan, which is why the readable form is free.

Do not preemptively rewrite a multi-reference CTE into a temp table. Write it the readable
way, and if that query later shows up as an actual measured problem, this paragraph tells you
where to look first.

### Alias every table, and mean something by it

`o` for Orders, `oi` for OrderItems. Never `a`, `b`, `t1`. Qualify every column in a
multi-table query — an unqualified column becomes ambiguous the day someone adds it to the
other table.

### Formatting inside C# verbatim strings

C# 7.3 has no raw string literals, so SQL lives in `@"..."`. Align the continuation to the
opening quote and keep one clause per line — the same shape as `wp-concrete-repository-pattern`.

```csharp
var sql = @"SELECT o.OrderId,
                   o.OrderDate,
                   SUM(oi.Qty * oi.Price) AS SubTotal
            FROM Orders o
            INNER JOIN OrderItems oi ON oi.OrderId = o.OrderId
            WHERE o.CustomerId = @CustomerId
            GROUP BY o.OrderId, o.OrderDate
            ORDER BY o.OrderDate DESC";
```

Keywords upper case, identifiers as the schema spells them. One-line queries stay on one
line — `"SELECT ProductId, ProductName FROM Products WHERE ProductId = @ProductId"` needs no
ceremony.

---

## Free performance — costs no readability, so always do it

- **Never wrap an indexed column in a function in `WHERE`.** `WHERE YEAR(OrderDate) = @Year`
  scans; `WHERE OrderDate >= @YearStart AND OrderDate < @NextYearStart` seeks. The range
  version is also the clearer statement of intent.
- **Explicit column lists** — already the rule above; it also stops the engine reading
  columns nobody wanted.
- **Set-based over row-by-row.** One `INSERT` with multiple `VALUES` rows, or one `UPDATE ...
  FROM`, instead of a C# loop calling `Execute` per row. Cursors are never the answer here.
- **`EXISTS` instead of `COUNT(*) > 0`** when you only need to know whether a row exists —
  it stops at the first match and says what you meant.
- **Filter before you join** where the filter is on the joined table and the join is `INNER` —
  move the predicate into the `ON` clause.
- **Kill N+1** — see above.

## Paid performance — costs readability, so bring evidence

Query hints, covering indexes designed around one query, window functions replacing a
readable aggregate, temp tables, denormalized read paths, `UNION` rewrites of `OR`.

None of these is a default. Reaching for one before a problem exists is over-engineering:
it buys a hypothetical gain with certain, permanent complexity, and the codebase pays the
interest forever. Write the simple version, ship it, and let real data tell you if it is a
problem.

**Once it is a problem, you need a measured number before rewriting**: the actual row count
and the actual execution time, from realistic data. Not an estimate, not a hunch. Then leave
the number in the code:

```sql
-- Perf: 68k detail rows; C#-side grouping measured 4.2s, this window function 0.3s.
-- Measured 2026-09-03 against PROD copy. Revisit if OrderItems shrinks.
```

A rewrite without that comment is an unexplained complication, and the next person will
either break it or revert it. The comment is what makes the trade reversible.

---

## Two pieces of common advice that are wrong

**`DISTINCT` → `GROUP BY` is not an optimization.** They deduplicate identically. The real
smell is a `DISTINCT` that exists to hide a join producing rows you did not want — fix the
join, or accept the `DISTINCT` as intentional. Swapping the keyword changes nothing.

**`OR` → `UNION` needs `UNION`, not `UNION ALL`.** The rewrite only holds when the branches
are mutually exclusive; when a row can satisfy both, `UNION ALL` duplicates it, and plain
`UNION` adds a sort that often eats the gain. Prove exclusivity or leave the `OR` alone.

---

## Review checklist

**Boundary**
- [ ] Every clause in the query reduces rows, orders them, or pages them — nothing else
- [ ] No business rule, threshold, or status derivation expressed as SQL `CASE`
- [ ] No display formatting in the query
- [ ] No `foreach` in a Service calling a Repository

**Readability**
- [ ] Explicit column list, no `SELECT *`
- [ ] Every computed column aliased
- [ ] At most two CTEs, no nested subquery that reads inside-out
- [ ] Meaningful table aliases; every column qualified in a multi-table query
- [ ] One method, one purpose — no shape-switching flag parameter

**Performance**
- [ ] No function wrapping an indexed column in `WHERE`
- [ ] Bulk changes are set-based, not a C# loop
- [ ] Every readability-costing rewrite carries a measured number and a date in a comment
