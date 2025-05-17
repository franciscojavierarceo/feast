# MLFlow Integration

Feast provides integration with [MLFlow](https://mlflow.org/) for tracking features, models, and experiments.

## Installation

To use MLFlow with Feast, install the MLFlow integration package:

```bash
pip install 'feast[mlflow]'
```

## Usage

### Tracking Feature Metadata in MLFlow

You can log feature service metadata to MLFlow:

```python
from feast import FeatureStore

store = FeatureStore(repo_path="path/to/feature/repo")
feature_service = store.get_feature_service("my_feature_service")

# Get MLFlow client
mlflow_client = store.get_mlflow_client()

# Log feature metadata
mlflow_client.log_feature_metadata(feature_service)
```

### Logging Feature Retrieval

You can log feature retrieval operations to MLFlow:

```python
from feast import FeatureStore
import pandas as pd

store = FeatureStore(repo_path="path/to/feature/repo")

# Create entity dataframe
entity_df = pd.DataFrame({"driver_id": [1001, 1002], "event_timestamp": [...]})

# Log feature retrieval to MLFlow
run_id = store.log_features_to_mlflow(
    features=["driver_stats:avg_daily_trips", "driver_stats:conv_rate"],
    entity_df=entity_df
)
```

### Registering Models with Feature Metadata

You can register models in the MLFlow model registry with associated feature metadata:

```python
from feast import FeatureStore
import mlflow

store = FeatureStore(repo_path="path/to/feature/repo")
feature_service = store.get_feature_service("my_feature_service")

# Train a model using MLFlow tracking
with mlflow.start_run() as run:
    # ... train model ...
    mlflow.sklearn.log_model(model, "model")
    model_uri = f"runs:/{run.info.run_id}/model"

# Register model with feature metadata
mlflow_client = store.get_mlflow_client()
model_version = mlflow_client.register_model_with_features(
    model_uri=model_uri,
    name="my_model",
    feature_service=feature_service
)
```

### RAG Prompt Evaluation with MLFlow

You can use MLFlow to evaluate different prompt templates in a Retrieval-Augmented Generation (RAG) system:

```python
from feast import FeatureStore
import mlflow
import numpy as np

store = FeatureStore(repo_path="path/to/feature/repo")

# Start an MLFlow experiment for prompt evaluation
mlflow.set_experiment("rag_prompt_evaluation")

# Evaluate different prompt templates
for template_idx, template in enumerate(prompt_templates):
    with mlflow.start_run(run_name=f"prompt_template_{template_idx}"):
        # Log the prompt template
        mlflow.log_param("prompt_template", template)
        
        # Evaluate each prompt against queries
        for query in queries:
            # Get embeddings and retrieve relevant documents
            # ...
            
            # Evaluate metrics and log to MLFlow
            metrics = evaluate_prompt(prompt=template, retrieved_docs=docs)
            for metric_name, metric_value in metrics.items():
                mlflow.log_metric(metric_name, metric_value)

# Register the best prompt as a model
mlflow.register_model(
    model_uri=f"runs:/{best_run_id}/prompt_model",
    name="best_rag_prompt"
)
```

For a complete example, see the [RAG Prompt Evaluation Example](https://github.com/feast-dev/feast/tree/master/examples/mlflow_integration/rag_evaluation).
