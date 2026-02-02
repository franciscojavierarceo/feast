# Federated Feature Store Setup

This guide describes how to set up a federated feature store architecture where multiple teams can contribute to a shared Feast registry while maintaining clear ownership boundaries. This pattern is particularly useful for organizations where a central platform team manages core feature infrastructure while individual teams own their training pipelines, scoring services, and team-specific feature definitions.

## Architecture Overview

In a federated setup, you typically have:

1. **Platform Repository (Central)**: A single repository that acts as the source of truth for the feature store. This repo manages the core `feature_store.yaml` configuration, entities, data sources, and batch/stream feature views. The platform team runs `feast apply` with `partial=False` to maintain full control over the core registry objects.

2. **Team Repositories (Distributed)**: Team-owned repositories for training pipelines and scoring/inference services. Teams can define their own FeatureServices and On-Demand Feature Views (ODFVs) in these repos, applying them with `partial=True` to avoid accidentally deleting objects they don't own.

```
                    ┌─────────────────────────────────────┐
                    │         Central Registry            │
                    │  (PostgreSQL, SQL, or Remote)       │
                    └─────────────────────────────────────┘
                                    ▲
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            │                       │                       │
    ┌───────┴───────┐       ┌───────┴───────┐       ┌───────┴───────┐
    │   Platform    │       │    Team A     │       │    Team B     │
    │     Repo      │       │     Repo      │       │     Repo      │
    │               │       │               │       │               │
    │ - Entities    │       │ - Feature     │       │ - Feature     │
    │ - Data Sources│       │   Services    │       │   Services    │
    │ - Feature     │       │ - ODFVs       │       │ - ODFVs       │
    │   Views       │       │               │       │               │
    │               │       │ partial=True  │       │ partial=True  │
    │ partial=False │       └───────────────┘       └───────────────┘
    └───────────────┘
```

## Understanding `partial` Apply

The `partial` parameter in `FeatureStore.apply()` controls whether Feast should delete registry objects that are not included in the current apply operation:

- **`partial=True` (default)**: Only adds or updates the specified objects. Objects not included in the apply call are left untouched. This is safe for team repos that only manage a subset of the registry.

- **`partial=False`**: Performs a full sync. Objects in `objects_to_delete` will be removed from the registry and their associated infrastructure will be torn down. This should only be used by the platform repo that has complete visibility of all core objects.

```python
from feast import FeatureStore, FeatureService

store = FeatureStore(repo_path=".")

# Team apply - only adds/updates the specified FeatureService
# Does NOT delete any existing objects
store.apply([my_feature_service], partial=True)

# Platform apply - full sync with deletion capability
# Will delete objects in objects_to_delete
store.apply(
    all_objects,
    objects_to_delete=objects_to_remove,
    partial=False
)
```

## Setting Up the Platform Repository

The platform repository is the authoritative source for core feature definitions. It should contain:

### Directory Structure

```
platform-feature-repo/
├── feature_store.yaml
├── entities/
│   ├── __init__.py
│   └── core_entities.py
├── data_sources/
│   ├── __init__.py
│   └── warehouse_sources.py
├── feature_views/
│   ├── __init__.py
│   ├── user_features.py
│   └── transaction_features.py
└── ci/
    └── apply.py
```

### Platform `feature_store.yaml`

Configure a shared registry that all repos can access. For production, use a SQL-based or remote registry:

```yaml
project: my_organization
provider: local
registry:
  registry_type: sql
  path: postgresql://user:password@host:5432/feast_registry
  sqlalchemy_config_kwargs:
    pool_size: 10
online_store:
  type: redis
  connection_string: redis://localhost:6379
offline_store:
  type: snowflake
  account: my_account
  # ... other config
```

For multi-tenant setups, each tenant can have its own project with a separate schema:

```yaml
project: tenant_a
registry:
  registry_type: sql
  path: postgresql://user:password@host:5432/feast_registry?options=-csearch_path%3Dtenant_a
```

### Platform Apply Script

The platform repo should run `partial=False` to maintain full control:

```python
# ci/apply.py
from feast import FeatureStore
from entities.core_entities import customer, driver, merchant
from data_sources.warehouse_sources import customer_source, driver_source
from feature_views.user_features import customer_features, driver_features

def apply_platform_features():
    store = FeatureStore(repo_path=".")
    
    # Collect all platform-managed objects
    all_objects = [
        # Entities
        customer,
        driver,
        merchant,
        # Data sources
        customer_source,
        driver_source,
        # Feature views
        customer_features,
        driver_features,
    ]
    
    # Full apply - platform owns these objects
    # Note: This will NOT delete FeatureServices or ODFVs 
    # that teams have added, as long as they're not in objects_to_delete
    store.apply(all_objects, partial=False)

if __name__ == "__main__":
    apply_platform_features()
```

## Setting Up Team Repositories

Team repositories reference the central registry and apply only their team-specific objects.

### Directory Structure

```
team-a-ml-repo/
├── feature_store.yaml
├── feature_services/
│   ├── __init__.py
│   └── fraud_detection_service.py
├── on_demand_features/
│   ├── __init__.py
│   └── risk_score_odfv.py
├── training/
│   └── train_model.py
└── serving/
    └── inference.py
```

### Team `feature_store.yaml`

Teams can either connect directly to the shared registry or use a remote registry server:

**Option 1: Direct Registry Access**

```yaml
project: my_organization
provider: local
registry:
  registry_type: sql
  path: postgresql://readonly_user:password@host:5432/feast_registry
online_store:
  type: redis
  connection_string: redis://localhost:6379
offline_store:
  type: snowflake
  account: my_account
```

**Option 2: Remote Registry (Recommended for larger organizations)**

```yaml
project: my_organization
provider: local
registry:
  registry_type: remote
  path: grpc://feast-registry.internal:6570
online_store:
  type: remote
  path: http://feast-server.internal:6566
```

### Team Feature Definitions

Teams define FeatureServices that compose platform-managed feature views:

```python
# feature_services/fraud_detection_service.py
from feast import FeatureService

# Reference feature views managed by the platform repo
# These are looked up from the registry at apply time
fraud_detection_service = FeatureService(
    name="fraud_detection_v1",
    features=[
        "customer_features:lifetime_value",
        "customer_features:account_age_days",
        "transaction_features:avg_transaction_amount_7d",
        "transaction_features:transaction_count_24h",
    ],
    tags={"team": "fraud", "version": "1"},
)
```

Teams can also define On-Demand Feature Views for request-time transformations:

```python
# on_demand_features/risk_score_odfv.py
from feast import on_demand_feature_view, Field
from feast.types import Float32
import pandas as pd

@on_demand_feature_view(
    sources=["customer_features", "transaction_features"],
    schema=[Field(name="risk_score", dtype=Float32)],
)
def risk_score_odfv(inputs: pd.DataFrame) -> pd.DataFrame:
    # Compute risk score from platform features
    df = pd.DataFrame()
    df["risk_score"] = (
        inputs["transaction_count_24h"] / 
        (inputs["account_age_days"] + 1)
    ).astype("float32")
    return df
```

### Team Apply Script

Teams must use `partial=True` to avoid deleting objects they don't own:

```python
# ci/apply.py
from feast import FeatureStore
from feature_services.fraud_detection_service import fraud_detection_service
from on_demand_features.risk_score_odfv import risk_score_odfv

def apply_team_features():
    store = FeatureStore(repo_path=".")
    
    # Only apply team-owned objects
    team_objects = [
        fraud_detection_service,
        risk_score_odfv,
    ]
    
    # CRITICAL: Use partial=True to avoid deleting platform objects
    store.apply(team_objects, partial=True)

if __name__ == "__main__":
    apply_team_features()
```

## Avoiding Registry Drift

Registry drift occurs when the registry state diverges from what's defined in code. Here are strategies to prevent it:

### 1. Establish Clear Ownership Boundaries

Define which object types each repo can manage:

| Object Type | Platform Repo | Team Repos |
|-------------|---------------|------------|
| Entities | Yes | No |
| Data Sources | Yes | No |
| Feature Views | Yes | No |
| Stream Feature Views | Yes | No |
| Feature Services | Optional | Yes |
| On-Demand Feature Views | Optional | Yes |

### 2. Use Naming Conventions

Enforce naming conventions to identify object ownership:

```python
# Platform objects
customer_features = FeatureView(name="platform__customer_features", ...)

# Team objects
fraud_service = FeatureService(name="team_fraud__detection_v1", ...)
```

### 3. Implement CI/CD Validation

Add validation in CI to ensure teams don't accidentally apply restricted object types:

```python
# ci/validate.py
from feast import FeatureStore, FeatureView, Entity, DataSource

def validate_team_apply(objects):
    """Ensure teams only apply allowed object types."""
    allowed_types = (FeatureService, OnDemandFeatureView)
    
    for obj in objects:
        if not isinstance(obj, allowed_types):
            raise ValueError(
                f"Team repos cannot apply {type(obj).__name__}. "
                f"Only FeatureService and OnDemandFeatureView are allowed."
            )
```

### 4. Use `feast plan` Before Apply

Always run `feast plan` to preview changes before applying:

```bash
# Preview what will be created/updated/deleted
feast plan

# Then apply if the plan looks correct
feast apply
```

### 5. Implement Registry Locking (Advanced)

For high-traffic environments, consider implementing registry locking to prevent concurrent applies:

```python
import fcntl
import os

def apply_with_lock(store, objects, partial=True):
    lock_file = "/tmp/feast_registry.lock"
    
    with open(lock_file, "w") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            store.apply(objects, partial=partial)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)
```

## Multi-Tenant Configuration

For organizations with multiple tenants sharing infrastructure, use separate projects with isolated schemas:

### PostgreSQL Registry with Schema Isolation

```yaml
# Tenant A
project: tenant_a
registry:
  registry_type: sql
  path: postgresql://user:pass@host:5432/feast?options=-csearch_path%3Dtenant_a_schema

# Tenant B  
project: tenant_b
registry:
  registry_type: sql
  path: postgresql://user:pass@host:5432/feast?options=-csearch_path%3Dtenant_b_schema
```

### Remote Registry with Project Isolation

Run a central registry server that handles multiple projects:

```bash
# Start the registry server
feast serve_registry --port 6570
```

Each tenant connects with their project name:

```yaml
# Tenant A feature_store.yaml
project: tenant_a
registry:
  registry_type: remote
  path: grpc://feast-registry.internal:6570
```

## Example: Complete Federated Setup

Here's a complete example showing the platform and team configurations working together.

### Platform Repository

```python
# platform-repo/entities.py
from feast import Entity

customer = Entity(
    name="customer_id",
    description="Unique customer identifier",
)

# platform-repo/feature_views.py
from feast import FeatureView, Field
from feast.types import Float32, Int64
from datetime import timedelta

customer_features = FeatureView(
    name="customer_features",
    entities=["customer_id"],
    schema=[
        Field(name="lifetime_value", dtype=Float32),
        Field(name="account_age_days", dtype=Int64),
    ],
    source=customer_source,
    ttl=timedelta(days=1),
)

# platform-repo/apply.py
from feast import FeatureStore

store = FeatureStore(repo_path=".")
store.apply([customer, customer_features], partial=False)
```

### Team Repository

```python
# team-repo/feature_services.py
from feast import FeatureService

# Compose a service from platform features
my_service = FeatureService(
    name="team_a__customer_scoring_v1",
    features=["customer_features"],
    tags={"team": "team_a", "use_case": "scoring"},
)

# team-repo/apply.py
from feast import FeatureStore

store = FeatureStore(repo_path=".")

# IMPORTANT: Always use partial=True in team repos
store.apply([my_service], partial=True)
```

### Using Features in Training

```python
# team-repo/training/train.py
from feast import FeatureStore
import pandas as pd

store = FeatureStore(repo_path=".")

# Get training data using the team's feature service
entity_df = pd.DataFrame({
    "customer_id": [1, 2, 3],
    "event_timestamp": pd.to_datetime(["2024-01-01"] * 3),
})

training_df = store.get_historical_features(
    entity_df=entity_df,
    features=store.get_feature_service("team_a__customer_scoring_v1"),
).to_df()
```

## Summary

A federated feature store setup enables multiple teams to collaborate on a shared feature registry while maintaining clear ownership boundaries. The key principles are:

1. **Platform repos use `partial=False`** to maintain authoritative control over core objects (entities, data sources, feature views).

2. **Team repos use `partial=True`** to safely add FeatureServices and On-Demand Feature Views without affecting objects they don't own.

3. **Use a shared registry** (SQL or remote) that all repos can access.

4. **Establish naming conventions** and CI validation to enforce ownership boundaries.

5. **Always run `feast plan`** before applying to preview changes.

This architecture reduces friction for team adoption while preventing registry drift and maintaining a single source of truth for feature definitions.
