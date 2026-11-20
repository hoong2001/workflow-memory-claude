---
name: wp-repository-unitofwork-pattern
description: Repository + UnitOfWork data access with Dapper for this C# 7.3 / MVC 5 stack. Use when writing, reviewing, or changing a Repository, BaseRepository, UnitOfWork, or any data-access code, or on Dapper, SQL parameterization, dynamic queries, or transaction questions.
---

# Repository Pattern with Dapper.NET

## Core Rules (Non-Negotiable)

§2.1 (layering), §3 (folders) and §4.1 of `project-memory/stack-architecture.md` apply in full;
this skill adds:

- Every value enters the SQL as a `DynamicParameters` parameter — a LIKE keyword included
  (`LIKE '%' + @Keyword + '%'`). Concatenating a value into the SQL string is the one hard ban
  (injection).
- The SQL text is one literal template with `{UPPER_SNAKE}` tokens, filled only by `sql.Replace` (**Dynamic Query
  Pattern** below). A table or view name, an optional condition, `ORDER BY` and paging each get a token; `+`, `Append`
  and `string.Format` assemble no SQL text.
- SQL Server only — `SqlConnection` is hardcoded; no multi-database abstraction

**Done when** every Repository method this task writes or changes passes each value through
`DynamicParameters` with an explicit `DbType` (`AnsiString` for `varchar`), passes `_transaction`,
keeps its SQL text one `{UPPER_SNAKE}` template filled by `sql.Replace`, maps its rows to a Result class, and every multi-step mutation runs in one UnitOfWork with
`Commit()` / `Rollback()`.

> This skill owns the C# around the query. What the query does, and how readable it is, belongs
> to `wp-database-design` — reach for it alongside this one when writing the SQL itself.

---

## UnitOfWork

```csharp
public class UnitOfWork : IDisposable
{
    public IDbConnection Connection { get; private set; }
    public IDbTransaction Transaction { get; private set; }

    private bool _disposed = false;

    // Repository backing fields — lazy instantiation
    private ProductRepository _productRepo;
    private StockRepository _stockRepo;

    // Repository properties — first access triggers instantiation, subsequent access reuses instance
    public ProductRepository ProductRepo => _productRepo ?? (_productRepo = new ProductRepository(this));
    public StockRepository StockRepo => _stockRepo ?? (_stockRepo = new StockRepository(this));

    public UnitOfWork(string connectionString, IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
    {
        Connection = new SqlConnection(connectionString); // SQL Server only — switching databases requires replacing SqlConnection
        Connection.Open();
        Transaction = Connection.BeginTransaction(isolationLevel);
    }

    public void Commit()
    {
        Transaction?.Commit();
    }

    public void Rollback()
    {
        Transaction?.Rollback();
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            Transaction?.Dispose();
            Connection?.Dispose();
            _disposed = true;
        }
    }
}
```

**Adding a new Repository:** add a backing field + property pair. No other changes needed.

**Read-only (dirty read allowed):**
```csharp
using (var uow = new UnitOfWork(_connectionString, IsolationLevel.ReadUncommitted))
{
    return uow.ProductRepo.GetById(id);
}
```

**Multi-step mutation (default ReadCommitted):**
```csharp
using (var uow = new UnitOfWork(_connectionString))
{
    try
    {
        uow.ProductRepo.Insert(product);
        uow.StockRepo.Update(stock);

        uow.Commit();
    }
    catch
    {
        uow.Rollback();
        throw;
    }
}
```

---

## BaseRepository

```csharp
public abstract class BaseRepository
{
    protected readonly IDbConnection _connection;
    protected readonly IDbTransaction _transaction;

    protected BaseRepository(UnitOfWork uow)
    {
        _connection = uow.Connection;
        _transaction = uow.Transaction;
    }
}
```

---

## Result Classes

Result classes (`Results/`, inheriting `BaseResult` — `project-memory/stack-architecture.md` §2.3–2.4) carry
data both ways: output, and input — `Insert(ProductResult model)`, and one criteria Result such as
`ProductSearchResult` for a multi-criteria method, never a long parameter list. A single-key
lookup takes the primitive (`GetById(long id)`).

```csharp
// Results/ProductResult.cs
public class ProductResult : BaseResult
{
    public long ProductId { get; set; }
    public string ProductName { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
}
```

---

## DynamicParameters — Standard Usage

Specify `DbType` explicitly for type safety.
Use `DbType.AnsiString` for a `varchar` column and `DbType.String` for `nvarchar`: an `nvarchar`
parameter against a `varchar` column forces an implicit conversion and can turn a seek into a scan.

```csharp
var p = new DynamicParameters();
p.Add("@ProductID", productId, DbType.Int64);
p.Add("@ProductName", name, DbType.String);
p.Add("@Price", price, DbType.Decimal);
p.Add("@IsActive", isActive, DbType.Boolean);
p.Add("@CreatedDate", date, DbType.DateTime);
```

---

## Repository Class — Full CRUD Example

```csharp
public class ProductRepository : BaseRepository
{
    public ProductRepository(UnitOfWork uow) : base(uow) { }

    // Single record
    public ProductResult GetById(long id)
    {
        var p = new DynamicParameters();
        p.Add("@ProductID", id, DbType.Int64);

        var sql = @"SELECT ProductID, ProductName, Price, CategoryID, IsActive
                    FROM Products
                    WHERE ProductID = @ProductID";
        return _connection.QueryFirstOrDefault<ProductResult>(sql, p, _transaction);
    }

    // List
    public IEnumerable<ProductResult> GetAll()
    {
        var sql = @"SELECT ProductID, ProductName, Price, CategoryID, IsActive
                    FROM Products
                    WHERE IsActive = 1";
        return _connection.Query<ProductResult>(sql, transaction: _transaction);
    }

    // Insert — returns new ID
    public long Insert(ProductResult model)
    {
        var p = new DynamicParameters();
        p.Add("@ProductName", model.ProductName, DbType.String);
        p.Add("@Price", model.Price, DbType.Decimal);
        p.Add("@IsActive", model.IsActive, DbType.Boolean);

        var sql = @"INSERT INTO Products (ProductName, Price, IsActive)
                    VALUES (@ProductName, @Price, @IsActive);
                    SELECT CAST(SCOPE_IDENTITY() AS BIGINT)";
        return _connection.ExecuteScalar<long>(sql, p, _transaction);
    }

    // Update
    public bool Update(ProductResult model)
    {
        var p = new DynamicParameters();
        p.Add("@ProductID", model.ProductId, DbType.Int64);
        p.Add("@ProductName", model.ProductName, DbType.String);
        p.Add("@Price", model.Price, DbType.Decimal);

        var sql = @"UPDATE Products
                    SET ProductName = @ProductName,
                        Price       = @Price
                    WHERE ProductID = @ProductID";
        return _connection.Execute(sql, p, _transaction) > 0;
    }

    // Delete
    public bool Delete(long id)
    {
        var p = new DynamicParameters();
        p.Add("@ProductID", id, DbType.Int64);

        var sql = "DELETE FROM Products WHERE ProductID = @ProductID";
        return _connection.Execute(sql, p, _transaction) > 0;
    }
}
```

---

## Dynamic Query Pattern

Define the whole SQL as one literal template with `{UPPER_SNAKE}` tokens, then fill every token with `sql.Replace`.

- **One token per line**, so a `--` comment never sits in front of a filled token. An unused token is filled with `string.Empty`.
- **Token names are `UPPER_SNAKE_CASE`** (`{KEYWORD}`, `{INVENTORY_TABLE}`, `{ORDER_BY}`). A query that already spells its
  tokens another way (`{PascalCase}`, `#Token`) keeps that spelling while it is edited; one query holds one spelling.
- **A token holds** a table or view name, an optional condition, an `ORDER BY` or a paging clause. An identifier token is
  filled from an enum, from a named constant, or after a whitelist check, never from request text.
- **A helper returns the text for a token** and adds that condition's parameter in the same method; the caller writes
  `sql = sql.Replace("{KEYWORD}", BuildKeywordFilter(p, criteria))`. A fragment that itself varies is a small template
  filled the same way.
- **A literal that carries meaning** (status code, warehouse code) is a named constant filled into a token.
- **Extending a legacy `+` / `Append` query:** the added line carries `// legacy-sql`, which `sql-concat-check.mjs` lets
  through; a new query is a template.

```csharp
// Results/ProductSearchResult.cs — search criteria (a Result class; no separate input layer exists)
public class ProductSearchResult : BaseResult
{
    public string Keyword { get; set; }
    public long? CategoryId { get; set; }
    public bool? IsActive { get; set; }
}

public IEnumerable<ProductResult> Search(ProductSearchResult criteria)
{
    var p = new DynamicParameters();

    var sql = @"SELECT ProductID, ProductName, Price, CategoryID, IsActive
                FROM Products
                WHERE 1=1
                {KEYWORD}
                {CATEGORY}
                {ACTIVE}";

    // Replace placeholders conditionally
    if (!string.IsNullOrEmpty(criteria.Keyword))
    {
        sql = sql.Replace("{KEYWORD}", "AND ProductName LIKE '%' + @Keyword + '%'");
        p.Add("@Keyword", criteria.Keyword, DbType.String);
    }
    else
    {
        sql = sql.Replace("{KEYWORD}", "");
    }

    if (criteria.CategoryId.HasValue)
    {
        sql = sql.Replace("{CATEGORY}", "AND CategoryID = @CategoryID");
        p.Add("@CategoryID", criteria.CategoryId.Value, DbType.Int64);
    }
    else
    {
        sql = sql.Replace("{CATEGORY}", "");
    }

    if (criteria.IsActive.HasValue)
    {
        sql = sql.Replace("{ACTIVE}", "AND IsActive = @IsActive");
        p.Add("@IsActive", criteria.IsActive.Value, DbType.Boolean);
    }
    else
    {
        sql = sql.Replace("{ACTIVE}", "");
    }

    return _connection.Query<ProductResult>(sql, p, _transaction);
}
```

---

## WHERE IN Parameters

`DynamicParameters.Add()` supports passing an array or list directly — Dapper automatically expands it into an `IN` clause.

```csharp
public IEnumerable<ProductResult> GetByIds(IEnumerable<long> ids)
{
    var p = new DynamicParameters();
    p.Add("@Ids", ids);  // Dapper expands to: IN (@Ids1, @Ids2, @Ids3...)

    var sql = @"SELECT ProductID, ProductName, Price, CategoryID, IsActive
                FROM Products
                WHERE ProductID IN @Ids";
    return _connection.Query<ProductResult>(sql, p, _transaction);
}
```