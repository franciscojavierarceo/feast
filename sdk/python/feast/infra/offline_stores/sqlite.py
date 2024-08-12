import sqlite3
from typing import List, Optional, Union

import pandas as pd
from feast import FeatureView
from feast.infra.offline_stores.offline_store import OfflineStore
from feast.infra.registry.base_registry import BaseRegistry
from feast.protos.feast.types.EntityKey_pb2 import EntityKey
from feast.protos.feast.types.Value_pb2 import Value

class SQLiteOfflineStore(OfflineStore):
    def __init__(self, db_path: str):
        self.db_path = db_path

    def get_historical_features(
        self,
        config: RepoConfig,
        feature_views: List[FeatureView],
        feature_refs: List[str],
        entity_df: Union[pd.DataFrame, str],
        registry: BaseRegistry,
        project: str,
        full_feature_names: bool = False,
    ) -> RetrievalJob:
        # Implementation for retrieving historical features
        pass

    def pull_latest_from_table_or_query(
        self,
        config: RepoConfig,
        data_source: DataSource,
        join_key_columns: List[str],
        feature_name_columns: List[str],
        event_timestamp_column: str,
        created_timestamp_column: Optional[str],
        start_date: datetime,
        end_date: datetime,
    ) -> RetrievalJob:
        # Implementation for pulling latest data from table or query
        pass

    def pull_all_from_table_or_query(
        self,
        config: RepoConfig,
        data_source: DataSource,
        join_key_columns: List[str],
        feature_name_columns: List[str],
        event_timestamp_column: str,
        start_date: datetime,
        end_date: datetime,
    ) -> RetrievalJob:
        # Implementation for pulling all data from table or query
        pass

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def _execute_query(self, query: str, params: Optional[tuple] = None) -> pd.DataFrame:
        with self._connect() as conn:
            return pd.read_sql_query(query, conn, params=params)

    def _insert_data(self, table_name: str, df: pd.DataFrame):
        with self._connect() as conn:
            df.to_sql(table_name, conn, if_exists='append', index=False)

class RetrievalJob:
    def __init__(self, query: str, db_path: str):
        self.query = query
        self.db_path = db_path

    def to_df(self) -> pd.DataFrame:
        with sqlite3.connect(self.db_path) as conn:
            return pd.read_sql_query(self.query, conn)

# Additional helper functions and classes as needed
