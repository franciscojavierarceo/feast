from typing import Dict, List, Optional, Union, Any
import pandas as pd
from datetime import datetime

import mlflow  # type: ignore
from mlflow.tracking import MlflowClient  # type: ignore

from feast.feature_service import FeatureService
from feast.saved_dataset import SavedDataset
from feast.infra.offline_stores.offline_store import RetrievalJob

class MLFlowFeatureStoreClient:
    """
    MLFlowFeatureStoreClient provides integration between Feast and MLFlow for tracking
    feature metadata, model versioning, and experiment metrics.
    """

    def __init__(self, tracking_uri: Optional[str] = None):
        """
        Initialize the MLFlow client.

        Args:
            tracking_uri: Optional tracking URI for MLFlow. If not provided, the MLFlow
                default will be used.
        """
        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()

    def log_feature_metadata(self, feature_service: FeatureService) -> None:
        """
        Log feature service metadata to MLFlow.

        Args:
            feature_service: The feature service to log.
        """
        with mlflow.start_run(run_name=f"feature_service_{feature_service.name}"):
            mlflow.log_param("feature_service_name", feature_service.name)
            
            for feature_view_projection in feature_service.feature_view_projections:
                view_name = feature_view_projection.name
                features = feature_view_projection.features
                
                mlflow.log_param(f"{view_name}_feature_count", len(features))
                for i, feature in enumerate(features):
                    mlflow.log_param(f"{view_name}_feature_{i}", feature)

    def log_retrieval_job(self, retrieval_job: RetrievalJob, run_id: Optional[str] = None) -> str:
        """
        Log a retrieval job to MLFlow.

        Args:
            retrieval_job: The retrieval job to log.
            run_id: Optional MLFlow run ID to log to. If not provided, a new run will be created.

        Returns:
            The MLFlow run ID.
        """
        run_context = mlflow.start_run(run_id=run_id) if run_id is None else mlflow.start_run(run_id=run_id)
        
        with run_context:
            mlflow.log_param("retrieval_timestamp", datetime.now().isoformat())
            
            df = retrieval_job.to_df()
            mlflow.log_metric("row_count", len(df))
            mlflow.log_metric("column_count", len(df.columns))
            
            for i, col in enumerate(df.columns):
                mlflow.log_param(f"column_{i}", col)
            
            active_run = mlflow.active_run()
            if active_run is None:
                raise ValueError("No active MLflow run found")
            return active_run.info.run_id

    def log_saved_dataset(self, saved_dataset: SavedDataset, run_id: Optional[str] = None) -> str:
        """
        Log a saved dataset to MLFlow.

        Args:
            saved_dataset: The saved dataset to log.
            run_id: Optional MLFlow run ID to log to. If not provided, a new run will be created.

        Returns:
            The MLFlow run ID.
        """
        run_context = mlflow.start_run(run_id=run_id) if run_id is None else mlflow.start_run(run_id=run_id)
        
        with run_context:
            mlflow.log_param("saved_dataset_name", saved_dataset.name)
            mlflow.log_param("feature_count", len(saved_dataset.features))
            
            for i, feature in enumerate(saved_dataset.features):
                mlflow.log_param(f"feature_{i}", feature)
            
            for i, key in enumerate(saved_dataset.join_keys):
                mlflow.log_param(f"join_key_{i}", key)
            
            mlflow.log_param("min_event_timestamp", str(saved_dataset.min_event_timestamp))
            mlflow.log_param("max_event_timestamp", str(saved_dataset.max_event_timestamp))
            
            active_run = mlflow.active_run()
            if active_run is None:
                raise ValueError("No active MLflow run found")
            return active_run.info.run_id

    def register_model_with_features(
        self, 
        model_uri: str, 
        name: str, 
        feature_service: FeatureService
    ) -> str:
        """
        Register a model with MLFlow and associate it with features from Feast.

        Args:
            model_uri: URI of the model to register.
            name: Name to register the model under.
            feature_service: Feature service used to train the model.

        Returns:
            The model version.
        """
        result = mlflow.register_model(model_uri, name)
        model_version = result.version
        
        self.client.set_model_version_tag(
            name=name,
            version=model_version,
            key="feature_service_name",
            value=feature_service.name
        )
        
        feature_names = []
        for projection in feature_service.feature_view_projections:
            feature_names.extend([f"{projection.name}__{f}" for f in projection.features])
        
        self.client.set_model_version_tag(
            name=name,
            version=model_version,
            key="feature_names",
            value=",".join(feature_names)
        )
        
        return model_version
