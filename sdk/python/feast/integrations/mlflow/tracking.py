from typing import Dict, List, Optional, Any
import mlflow  # type: ignore
import pandas as pd

class MLFlowLogger:
    """
    Utility class for logging Feast-related metrics and parameters to MLFlow.
    """

    @staticmethod
    def log_features_retrieval(
        feature_names: List[str],
        entity_df: pd.DataFrame,
        feature_df: pd.DataFrame,
        params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log information about a feature retrieval operation to MLFlow.

        Args:
            feature_names: Names of the features being retrieved.
            entity_df: Entity dataframe used for retrieval.
            feature_df: Resulting feature dataframe.
            params: Additional parameters to log.

        Returns:
            The MLFlow run ID.
        """
        with mlflow.start_run(run_name="feast_feature_retrieval"):
            for i, feature in enumerate(feature_names):
                mlflow.log_param(f"feature_{i}", feature)
            mlflow.log_metric("entity_row_count", len(entity_df))
            mlflow.log_metric("entity_column_count", len(entity_df.columns))
            mlflow.log_metric("feature_row_count", len(feature_df))
            mlflow.log_metric("feature_column_count", len(feature_df.columns))
            if params:
                for key, value in params.items():
                    mlflow.log_param(key, value)
            active_run = mlflow.active_run()
            if active_run is None:
                raise ValueError("No active MLflow run found")
            return active_run.info.run_id
