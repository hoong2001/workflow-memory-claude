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
- SQL Server only — `SqlConnection` is hardcoded; no multi-database abstraction

**Done when** every Repository method this task writes or changes passes each value through
`DynamicParameters` with an explicit `DbType` (`AnsiString` for `varchar`), passes `_transaction`,
maps its rows to a Result class, and every multi-step mutation runs in one UnitOfWork with
`Commit()` / `Rollback()`.

> This skill owns the C# around the query. What the query does, and how readable it is, belongs
> to `wp-sql-query-design` — reach for it alongside this one when writing the SQL itself.

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

Result classes (`Results/`, inheriting `BaseResult` — `stack-architecture.md` §2.3–2.4) carry
data both ways: output, and input — `Insert(ProductResult model)`, and one criteria Result such as
`ProductSearchResult` for a multi-criteria method, never a long parameter list. A single-key
lookup takes the primitive (`GetById(int id)`).

```csharp
// Results/ProductResult.cs
public class ProductResult : BaseResult
{
    public int ProductId { get; set; }
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
p.Add("@ProductID", productId, DbType.Int32);
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
    public ProductResult GetById(int id)
    {
        var p = new DynamicParameters();
        p.Add("@ProductID", id, DbType.Int32);

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
    public int Insert(ProductResult model)
    {
        var p = new DynamicParameters();
        p.Add("@ProductName", model.ProductName, DbType.String);
        p.Add("@Price", model.Price, DbType.Decimal);
        p.Add("@IsActive", model.IsActive, DbType.Boolean);

        var sql = @"INSERT INTO Products (ProductName, Price, IsActive)
                    VALUES (@ProductName, @Price, @IsActive);
                    SELECT CAST(SCOPE_IDENTITY() AS INT)";
        return _connection.ExecuteScalar<int>(sql, p, _transaction);
    }

    // Update
    public bool Update(ProductResult model)
    {
        var p = new DynamicParameters();
        p.Add("@ProductID", model.ProductId, DbType.Int32);
        p.Add("@ProductName", model.ProductName, DbType.String);
        p.Add("@Price", model.Price, DbType.Decimal);

        var sql = @"UPDATE Products
                    SET ProductName = @ProductName,
                        Price       = @Price
                    WHERE ProductID = @ProductID";
        return _connection.Execute(sql, p, _transaction) > 0;
    }

    // Delete
    public bool Delete(int id)
    {
        var p = new DynamicParameters();
        p.Add("@ProductID", id, DbType.Int32);

        var sql = "DELETE FROM Products WHERE ProductID = @ProductID";
        return _connection.Execute(sql, p, _transaction) > 0;
    }
}
```

---

## Dynamic Query Pattern

Use string replace to build conditional WHERE clauses.
Define the full SQL template with placeholder tokens, then replace only when values are present.

```csharp
// Results/ProductSearchResult.cs — search criteria (a Result class; no separate input layer exists)
public class ProductSearchResult : BaseResult
{
    public string Keyword { get; set; }
    public int? CategoryId { get; set; }
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
        p.Add("@CategoryID", criteria.CategoryId.Value, DbType.Int32);
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
public IEnumerable<ProductResult> GetByIds(IEnumerable<int> ids)
{
    var p = new DynamicParameters();
    p.Add("@Ids", ids);  // Dapper expands to: IN (@Ids1, @Ids2, @Ids3...)

    var sql = @"SELECT ProductID, ProductName, Price, CategoryID, IsActive
                FROM Products
                WHERE ProductID IN @Ids";
    return _connection.Query<ProductResult>(sql, p, _transaction);
}
```