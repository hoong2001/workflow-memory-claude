---
name: wp-database-design
description: Database design for this stack: SQL query design, table conventions, table ownership, and how data flows from request to commit. Use when writing or reviewing any SQL (a Repository query, a .sql script), deciding where a calculation or rule lives, weighing a performance rewrite, or on N+1, paging or CTE questions; when a task creates or alters a table, column, key, index or constraint, or designs a module's data model; when deciding who may write a table several modules read; or when SQL reaches another database.
---

# Database Design

Two parts. **Query design** (`references/query-design.md`) applies to every piece of SQL this task writes or reviews. **Table design** (the rest of this file) applies to every NEW table and every NEW query that reaches another database; a table or query that already exists keeps its own conventions (`project-memory/stack-architecture.md` §0 brownfield rule). Done when every query this task writes or reviews passes the checklist at the end of `references/query-design.md`, and every table it creates or alters passes every row of the **Review checklist** at the end of this file.

## Scope — what this skill owns, and what it does not

| Concern | Owner |
|---|---|
| Table shape: names, keys, types, audit columns, constraints, indexes; who owns and writes a table; transaction boundary of a write | **this skill** |
| What a query does, how simple it stays, where logic lives (SQL vs Service), reading the real definition first | **this skill** → `references/query-design.md` |
| `DynamicParameters`, UnitOfWork, BaseRepository, Dapper mechanics | `wp-repository-unitofwork-pattern` |
| `.sql`-file conventions — plain-INSERT seeds, ship it as a real file | `.claude/rules/workspace-sql-house-style.md` rule |
| SQL Server version, layering, forbidden patterns (no stored procedures, no EF) | `project-memory/stack-architecture.md` §1, §2, §4.1 |

## Query design

Open `references/query-design.md` before writing or reviewing any SQL: it holds the full rules and its own review checklist. Every query meets these four:

- **Row-count test.** Keep work in SQL when moving it to C# would send more rows across the connection; move it to C# when it would not. Business rules and display formatting stay in the Service.
- **Read the real definition first.** Read the actual table or view — the live object when a database is reachable (read it under `.claude/skills/_database-access.md`), else the `.sql` in the module's `schema/` — and echo the column list back before writing the query.
- **Name every column.** List the columns instead of `SELECT *`, and give every computed column an alias.
- **Simple first.** A rewrite that costs readability needs a measured row count and run time, written into a comment (`references/query-design.md` → *Paid performance*).

## Table conventions

| Item | Rule |
|---|---|
| Table / column names | PascalCase, singular table (`SalesOrder`, `SalesOrderItem`); the **Naming** principles of `.claude/rules/workspace-code-style.md` apply |
| Reserved words | A table, column, view or constraint name is never, as a whole word, on Microsoft's [Reserved Keywords (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/reserved-keywords-transact-sql) page — its Transact-SQL reserved, ODBC reserved and future keyword lists. A compound name clears it: `Order` → `SalesOrder`, `Date` → `OrderDate`, `Key` → `ApiKey`, `User` → `AppUser`, `Level` → `AccessLevel`. A reserved name parses only inside `[brackets]`, in every query that touches it |
| Index and constraint names | `<Type>_<Table>[_<Columns>]`, Type being `PK` (primary key), `UQ` (`UNIQUE`) or `IX` (index): `PK_SalesOrder`, `UQ_SalesOrder_OrderNo`, `IX_SalesOrderItem_SalesOrderId`. Columns follow in key order, joined by `_`. Every such object is named in the `.sql`; the name states the table and the columns it covers |
| Result mapping | A Result property carries the same name as its column, so Dapper maps by name with no alias |
| Primary key | The business key: one column (`CustomerId`) or a composite of several. Not every table has one: Claude infers the candidate (**Inferred keys**), and it enters the `.sql` only after the user confirms |
| `Id` column | Every table also carries `Id bigint IDENTITY(1,1)` — a spare, ever-increasing counter (a `long` property in the Result class). It is the primary key only when the table has no business key, which is rare and recorded in the plan |
| Foreign key | No `FOREIGN KEY` constraint on any new table. The relationship is logical: the column keeps the name of the key it references (`CustomerId` references `Customer.CustomerId`; a composite key keeps each column's name), the plan's `erDiagram` draws it, and the Service keeps it intact |
| Types | `nvarchar` for text, `datetime` for date and time, `date` for a date with no time, `decimal(18,4)` for money, `bit` for flags |
| Audit columns | `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy` on every transactional table |
| Deletion | Hard delete by default; a table that must keep history carries `IsActive bit` — recorded as a decision in the plan |
| Constraints | A confirmed primary key or `UNIQUE`, and `NOT NULL`, live in the database, never only in a Service check; referential integrity has no database constraint, so the Service owns it (**Ownership and flow**) |
| Indexes | Every column that references another table, and every column a Repository query filters or sorts on; listed in the `.sql` |

## Ownership and flow

- **One writer per table.** The owning module's Repository is the only code that INSERTs, UPDATEs or DELETEs it; other modules read it through that entity's Repository, never with their own SQL on it.
- **Direction of data.** Request → Controller → Service (rules, decides what to save) → Repository (parameterized SQL) → UnitOfWork (commits) → SQL Server. A read returns the same path in reverse as a Result object.
- **Referential integrity lives in the Service.** With no `FOREIGN KEY`, the Service that inserts a child row first confirms its parent exists, and the Service that deletes a parent decides what happens to its children (delete them, block the delete, or keep them), both inside the one transaction. The owning Repository supplies the existence and child-count queries.
- **One business operation, one transaction.** A write that touches more than one table commits or rolls back as a whole through the UnitOfWork; a Service never commits half of an operation.
- **A table several modules read and none owns** → record its owner and readers in the overview §5 CRUD matrix and `project-memory/docs/`.
- **Who writes this data today?** → the CRUD matrix in `project-memory/overview/system-overview-spec.md` §5, when the overview has one: the one module holding C, U or D on that row.

## Another database

Repository SQL never names another database (`OtherDb.dbo.Table`). It goes through an object in the system DB, which holds the other database's name in one place, so renaming or moving that database changes only that object.

| Access | Object | Name | Behaviour |
|---|---|---|---|
| Read | View | `dbo.vw_<Name>`, e.g. `vw_OtherCustomer` | Fixes the shape the Repository sees, so a column change in the other database is absorbed in the view |
| Write (INSERT / UPDATE / DELETE) | Synonym | `dbo.syn_<Name>`, e.g. `syn_OtherCustomer` | The Repository writes parameterized SQL against it as against a local table; the UnitOfWork transaction covers it |

- **Same SQL Server instance** → the synonym targets `OtherDb.dbo.Table`; the transaction stays local.
- **Another server** → the synonym targets the linked server, `LinkedServer.OtherDb.dbo.Table`; SQL Server promotes the transaction to a distributed one, so MSDTC must be configured on both servers.
- The prefix names the object it exposes, so a reader of the Repository SQL knows it reaches another database without opening the definition.
- The view / synonym `.sql` lives in the module's `schema/` and ships in the plan's Deployment list like any schema change.

## Inferred keys

A primary key or `UNIQUE` constraint is not assumed on every table. Per table the change creates, Claude infers which column set identifies a row (primary key) and which columns must not repeat (`UNIQUE`) from the plan, the real definition in `schema/` and the Result classes. Each inference goes to the user as a question — one per table, the inference as the first option, with its basis (what the columns hold and why they identify a row). Confirmed → it enters the `.sql`. Declined, or no candidate → the table is created without it, and the plan's `### Data model` says so. A basis nothing confirms is marked `unverified`.

## The data model of a plan

`/wp-module-technical-design` writes the plan's `### Data model` from this skill. Start from the real definition in the module's `schema/` (`references/query-design.md` → **Read the real definition first**). Per table the change creates or alters, state the owner module, columns and types, keys, constraints, indexes, who reads it, and the transaction boundary of each multi-table write; draw the relationships as an `erDiagram`, and each status field the change adds or changes as a `stateDiagram-v2`. The table itself ships as a real `.sql` in the owning module's `schema/`, named `<name>-<date>-<slug>.sql` when Claude generates it.

## Review checklist

| Check | Passes when |
|---|---|
| Names | Every table and column follows the naming row, every index and constraint follows the index-and-constraint row; no name is cryptic or over 50 characters |
| Reserved words | Each table, column, view and constraint name checked against the three keyword lists; none is a whole-word match |
| Keys | Each primary key and `UNIQUE` was inferred, put to the user with its basis, and is in the `.sql` only if confirmed; every table carries `Id bigint IDENTITY(1,1)`; no `FOREIGN KEY` constraint is declared; each relationship column keeps the referenced key's name |
| Integrity | The Service that writes a child row checks its parent, and the Service that deletes a parent handles its children, in one transaction |
| Audit and deletion | Audit columns present; the deletion choice is written as a decision |
| Constraints | Every confirmed primary key and `UNIQUE`, and every `NOT NULL`, is in the `.sql`; each table left without a key is named in the plan |
| Indexes | Each referencing column and each filter or sort column has one, or the plan says why not |
| Ownership | Exactly one module writes the table; its readers are named |
| Transaction | Every multi-table write names the operation that commits it |
| Other database | Repository SQL names no other database; reads go through a `vw_` view, writes through a `syn_` synonym |
| Delivery | The definition is a `.sql` file in `schema/`, not prose in a plan or reply |
