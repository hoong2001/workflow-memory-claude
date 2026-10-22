# Repository interfaces (only where §4.1 permits them)

Read this only when `project-memory/stack-architecture.md` §4.1 explicitly permits Repository
interfaces and the module's `MODULE.md` Local conventions records them.

Only the declared types change. UnitOfWork stays concrete and still news up the Repository,
because the Repository runs on UnitOfWork's connection and transaction; the container-free
`using (var uow = new UnitOfWork(...))` call sites stay exactly as they are.

```csharp
public interface IProductRepository
{
    ProductResult GetById(int productId);
    int Insert(ProductResult product);
}

public class ProductRepository : BaseRepository, IProductRepository { ... }

// In UnitOfWork — field and property typed as the interface
private IProductRepository _productRepo;
public IProductRepository ProductRepo => _productRepo ?? (_productRepo = new ProductRepository(this));
```

Interfaces sit beside their Repositories in `Repositories/`, named `I[Entity]Repository`.

Follow the module's `MODULE.md` Local conventions: a module gives every Repository an interface
or none. Never mix the two forms inside one module. A module with no such record has none — so an
existing module keeps its concrete Repositories when the architecture doc is switched.
