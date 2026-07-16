---
name: workspace-concrete-repository-pattern
description: Repository Pattern implementation guide using Dapper.NET for C# 7.3 ASP.NET MVC 5 projects. Use this skill whenever writing, reviewing, or modifying Repository classes, BaseRepository, UnitOfWork, or any data access layer code. Also trigger when the user asks about Dapper queries, SQL parameterization, dynamic queries, transaction management, or DAL structure. Always use DynamicParameters for all queries. No interfaces, no async, no DI, no stored procedures.
---

# Repository Pattern with Dapper.NET

## Core Rules (Non-Negotiable)
- No async / await — synchronous only
- No Dependency Injection — concrete class instantiation only
- No interfaces for Repository or UnitOfWork
- No stored procedures — Raw SQL only (supports dynamic query)
- No DTO or Entities — use `Results/` classes for all object mapping
- Always use `DynamicParameters` for all queries — exception: WHERE IN (see below)
- All SQL must be parameterized — no string concatenation
- Business logic in Service layer only — never in Repository
- SQL Server only — `SqlConnection` is hardcoded; no multi-database abstraction

---

## Project Layer Mapping

```
[ProjectName].UnitOfWork
├── ConstValues/       ← Constants and enums
├── Repositories/      ← Repository classes (concrete, no interfaces)
├── Results/           ← Result classes for object mapping (output)
└── UnitOfWork.cs      ← Transaction control, implements IDisposable
```

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

All query results are mapped to classes in the `Results/` folder.
No DTOs, no Entities — Result classes are the single output model.
**Every Result class must inherit `BaseResult`** (in `Results/BaseResult.cs`) — mandatory per the project architecture.

```csharp
// Results/ProductResult.cs
public class ProductResult : BaseResult
{
    public int ProductID { get; set; }
    public string ProductName { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
}
```

---

## DynamicParameters — Standard Usage

Always use `DynamicParameters`. Specify `DbType` explicitly for type safety.

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

        var sql = "SELECT * FROM Products WHERE ProductID = @ProductID";
        return _connection.QueryFirstOrDefault<ProductResult>(sql, p, _transaction);
    }

    // List
    public IEnumerable<ProductResult> GetAll()
    {
        var sql = "SELECT * FROM Products WHERE IsActive = 1";
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
        p.Add("@ProductID", model.ProductID, DbType.Int32);
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

**Input convention:** multi-criteria methods take an **input object**, never a long parameter list.
There is no separate input/Parameter layer — in this architecture the input object is a `Result` class
(in `Results/`, inheriting `BaseResult`), the same universal carrier used for output. This keeps `Search`
consistent with `Insert(ProductResult model)` / `Update(ProductResult model)`. Single-key lookups
(`GetById(int id)`) still take a primitive — one argument is no smell.

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

    var sql = @"SELECT * FROM Products
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
Both `DynamicParameters` and anonymous type work. Use `DynamicParameters` to stay consistent.

```csharp
// ✅ Using DynamicParameters — preferred for consistency
public IEnumerable<ProductResult> GetByIds(IEnumerable<int> ids)
{
    var p = new DynamicParameters();
    p.Add("@Ids", ids);  // Dapper expands to: IN (@Ids1, @Ids2, @Ids3...)

    var sql = "SELECT * FROM Products WHERE ProductID IN @Ids";
    return _connection.Query<ProductResult>(sql, p, _transaction);
}

// ✅ Using anonymous type — also valid
public IEnumerable<ProductResult> GetByIds(IEnumerable<int> ids)
{
    var sql = "SELECT * FROM Products WHERE ProductID IN @Ids";
    return _connection.Query<ProductResult>(sql, new { Ids = ids }, _transaction);
}
```

---

## Common Dapper Methods

| Method | Use Case |
|--------|---------|
| `Query<T>` | Return list of Result records |
| `QueryFirstOrDefault<T>` | Return single Result, null if not found |
| `Execute` | INSERT / UPDATE / DELETE — returns rows affected |
| `ExecuteScalar<T>` | Return single value (e.g. new ID after INSERT) |
| `QueryMultiple` | Multiple result sets from one query |

---

## Security Rules

❌ **Never — SQL injection:**
```csharp
var sql = "SELECT * FROM Products WHERE Name = '" + name + "'";
```

✅ **Always — DynamicParameters:**
```csharp
var p = new DynamicParameters();
p.Add("@Name", name, DbType.String);
var sql = "SELECT * FROM Products WHERE Name = @Name";
```

❌ **Never — LIKE injection:**
```csharp
var sql = "SELECT * FROM Products WHERE Name LIKE '%" + keyword + "%'";
```

✅ **Correct LIKE:**
```csharp
var p = new DynamicParameters();
p.Add("@Keyword", keyword, DbType.String);
var sql = "SELECT * FROM Products WHERE Name LIKE '%' + @Keyword + '%'";
```