---
name: wp-sql-query-design
description: SQL query design for this stack: the row-count test decides what belongs in SQL vs the C# Service layer, and the SQL that remains stays simple and readable. Use when writing or reviewing any SQL (a Repository query, a .sql schema, seed, or test script), deciding where a calculation or rule should live, weighing a performance rewrite against readability, or on N+1, paging, window-function, or CTE-vs-temp-table questions.
---

# SQL Query Design

Applies to every piece of SQL this project writes — a Repository query, a `.sql` schema or seed
script, a persisted test script. Done when every query this task writes or reviews passes every
row of the **Review checklist** at the end.

Readability and maintainability rank above query cleverness: performance may cost clarity only
with a **measured** number (*Paid performance*).

## Scope — what this skill owns, and what it does not

| Concern | Owner |
|---|---|
| What the query should do, how simple it should be, where logic lives | **this skill** |
| `DynamicParameters`, UnitOfWork, BaseRepository, dynamic WHERE assembly, `WHERE IN`, Dapper method choice, parameterization | `wp-repository-unitofwork-pattern` |
| `.sql`-file conventions — plain-INSERT seeds, ship it as a real file | `workspace-sql-house-style.md` rule |
| Stack versions, layering, forbidden patterns | `project-memory/stack-architecture.md` |

The readability rules below apply to `.sql` files too — a seed or schema script gets the same
explicit column lists and the same ban on `SELECT *`. The house-style rule owns what is
special about `.sql` files; this skill owns what every piece of SQL has in common.

Seed / reference data ships as a `.sql` file in the module's `schema/` (`workspace-sql-house-style.md` rule 3).

---

## The one rule: the row-count test

> **Keep work in SQL when moving it to C# would send more rows across the connection.
> Move it to C# when it would not.**

The test is objective, so two people applying it reach the same answer. It also happens to
put the database engine on exactly the work it is better at — reducing a result set — and
leaves the reasoning about that result set to a language you can debug and unit-test.

### Where each kind of logic belongs

| Work | Where | Why |
|---|---|---|
| `WHERE` filtering | SQL | Fewer rows returned |
| `JOIN` | SQL | The set operation the engine exists for |
| `GROUP BY` + `SUM`/`COUNT`/`MAX` | SQL | 2000 detail rows become 20 |
| `ORDER BY` | SQL, even without paging | The index supplies order; a C# sort is waste |
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
using (var uow = new UnitOfWork(_connectionString))
{
    var orders = uow.OrderRepo.GetByCustomer(customerId);
    foreach (var o in orders)
        o.Items = uow.OrderItemRepo.GetByOrder(o.OrderId);
    return orders;
}
```

```csharp
// ✅ One round trip, reshaped in C#
using (var uow = new UnitOfWork(_connectionString))
{
    var rows = uow.OrderRepo.GetWithItemsByCustomer(customerId);
    return rows.GroupBy(r => r.OrderId)
               .Select(g => new OrderResult
               {
                   OrderId   = g.Key,
                   OrderDate = g.First().OrderDate,
                   Items     = g.Select(ToItem).ToList()
               })
               .ToList();
}
```

For a parent list plus a child list that do not flatten cleanly, one `QueryMultiple` call returns
both sets in one round trip.

**Review trigger:** any `foreach` whose body calls a Repository method through the UnitOfWork
(`uow.<Entity>Repo...`). Check every one.

---

## Keep the query readable

### Read the real definition first

Before designing anything on top of a view or table, read its ACTUAL current definition — the
`.sql` in the module's `schema/` folder, or the live database object. Never infer a schema from a
sibling module or an earlier design document, and never rely on recall. The user hand-edits views:
their local edit is the source of truth, and every round of "fix the columns" is a round a single
read would have prevented. Echo back the exact column list you are relying on before writing the
query, so a mismatch surfaces in one cheap confirmation.

### List every column — `SELECT *` is the one absolute ban

```sql
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

**Reference a CTE once.** SQL Server expands a non-recursive CTE at every reference, so a second
reference can run its query twice; referenced once, it compiles to the same plan as the subquery.
A multi-reference CTE stays as written until a measured problem sends it to *Paid performance*.

### Alias every table, and mean something by it

`o` for Orders, `oi` for OrderItems. Qualify every column in a
multi-table query — an unqualified column becomes ambiguous the day someone adds it to the
other table. Join conditions go in `ON`, filters in `WHERE`, where a reader looks for them.

### Formatting inside C# verbatim strings

SQL lives in `@"..."` (C# 7.3 has no raw string literals): one clause per line, continuation
aligned under the first keyword, keywords upper case, identifiers as the schema spells them — the
shape of every sample here and in `wp-repository-unitofwork-pattern`. A one-line query stays on
one line.

---

## Free performance — costs no readability, so always do it

- **Compare an indexed column bare in `WHERE`.** `OrderDate >= @YearStart AND OrderDate <
  @NextYearStart` seeks; `YEAR(OrderDate) = @Year` scans. The range also states the intent.
- **Set-based over row-by-row.** One `INSERT` with multiple `VALUES` rows, or one `UPDATE ...
  FROM`, instead of a C# loop calling `Execute` per row. Cursors are never the answer here.
- **`EXISTS` instead of `COUNT(*) > 0`** when you only need to know whether a row exists —
  it stops at the first match and says what you meant.

## Paid performance — costs readability, so bring evidence

Query hints, covering indexes designed around one query, window functions replacing a
readable aggregate, temp tables, denormalized read paths, `UNION` rewrites of `OR`.

None of these is a default: ship the simple version, and rewrite only on a measured problem.

**Once it is a problem, you need a measured number before rewriting**: the actual row count
and the actual execution time, from realistic data. Not an estimate, not a hunch. Then leave
the number in the code:

```sql
-- 2026.09.03 Perf: 68k detail rows; C#-side grouping measured 4.2s, this window function 0.3s.
-- Measured against PROD copy. Revisit if OrderItems shrinks.
```

A rewrite without that comment is an unexplained complication, and the next person will
either break it or revert it. The comment is what makes the trade reversible.

Before proposing or accepting an `ON`↔`WHERE`, `DISTINCT`→`GROUP BY`, or `OR`→`UNION` rewrite,
read `references/rewrites-that-buy-nothing.md`.

---

## Review checklist

**Boundary**
- [ ] Every clause in the query reduces rows, orders them, or pages them — nothing else
- [ ] No business rule, threshold, or status derivation expressed as SQL `CASE`
- [ ] No display formatting in the query
- [ ] No `foreach` in a Service calling a Repository

**Readability**
- [ ] Columns read from the real view/table definition and echoed back before the query was written
- [ ] Explicit column list, no `SELECT *`
- [ ] Every computed column aliased
- [ ] At most two CTEs, no nested subquery that reads inside-out
- [ ] Meaningful table aliases; every column qualified in a multi-table query
- [ ] One method, one purpose — no shape-switching flag parameter

**Performance**
- [ ] No function wrapping an indexed column in `WHERE`
- [ ] Bulk changes are set-based, not a C# loop
- [ ] Every readability-costing rewrite carries a measured number and a date in a comment
