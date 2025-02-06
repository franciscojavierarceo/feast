import sqlite3
import tempfile
import time
from datetime import datetime, timedelta

import pandas as pd
import pytest

from feast import FeatureService, FeatureStore, RepoConfig
from feast.entity import Entity
from feast.feature_view import FeatureView
from feast.field import Field
from feast.infra.offline_stores.sqlite import SQLiteOfflineStoreConfig
from feast.infra.offline_stores.sqlite_source import SQLiteSource
from feast.on_demand_feature_view import on_demand_feature_view
from feast.saved_dataset import SavedDatasetStorage
from feast.types import Float32, Int64, String
from feast.value_type import ValueType


def get_test_data():
    now = datetime.utcnow()
    df = pd.DataFrame(
        {
            "driver_id": [1, 2, 3],
            "event_timestamp": [
                now - timedelta(days=1),
                now,
                now + timedelta(days=1),
            ],
            "value": [1.1, 2.2, 3.3],
            "rating": [4.5, 3.9, 4.1],
            "status": ["active", "inactive", "active"],
        }
    )
    return df

@pytest.fixture
def feature_store():
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        store_config = SQLiteOfflineStoreConfig(
            type="sqlite",
            path=temp_db.name,
        )
        registry_file = tempfile.NamedTemporaryFile(suffix='.json')
        config = RepoConfig(
            registry=registry_file.name,
            project="test_sqlite",
            provider="local",
            offline_store=store_config,
            online_store={"type": "sqlite", "path": ":memory:"},
        )
        fs = FeatureStore(config=config)
        # Create test data
        df = get_test_data()
        conn = sqlite3.connect(store_config.path)
        df.to_sql("driver_stats", conn, if_exists='replace', index=False)
        conn.close()

        # Define entity
        driver = Entity(
            name="driver",
            join_keys=["driver_id"],
            value_type=ValueType.INT64,
        )

        # Define feature view
        driver_stats_view = FeatureView(
            name="driver_stats",
            entities=[driver],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
                Field(name="rating", dtype=Float32),
                Field(name="status", dtype=String),
            ],
            source=SQLiteSource(
                table="driver_stats",
                timestamp_field="event_timestamp",
            ),
        )

        # Apply feature definitions
        fs.apply([driver, driver_stats_view])

        yield fs, driver_stats_view, driver

def test_basic_retrieval(feature_store):
    fs, driver_stats_view, driver = feature_store

    entity_df = pd.DataFrame(
        {
            "driver_id": [1, 2],
            "event_timestamp": [
                datetime.utcnow() - timedelta(days=1),
                datetime.utcnow(),
            ],
        }
    )

    # Test basic feature retrieval
    feature_refs = ["driver_stats:value", "driver_stats:rating"]
    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=feature_refs,
    ).to_df()

    assert not feature_data.empty
    assert "value" in feature_data.columns
    assert "rating" in feature_data.columns
    assert len(feature_data) == len(entity_df)

    # Create and test feature service
    service = FeatureService(
        name="driver_service",
        features=[driver_stats_view],
    )
    fs.apply([service])

    service_feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=service.features,
    ).to_df()

    assert not service_feature_data.empty
    assert "driver_stats__value" in service_feature_data.columns
    assert "driver_stats__rating" in service_feature_data.columns

def test_point_in_time_joins(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test point-in-time correctness
    entity_df = pd.DataFrame(
        {
            "driver_id": [1],
            "event_timestamp": [datetime.utcnow() - timedelta(days=1)],
        }
    )

    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=["driver_stats:value"],
    ).to_df()

    assert not feature_data.empty
    assert feature_data["value"].iloc[0] == 1.1
def test_multiple_feature_views(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create another feature view
    driver_extra_stats = FeatureView(
        name="driver_extra_stats",
        entities=[Entity(name="driver", join_keys=["driver_id"])],
        schema=[
            Field(name="driver_id", dtype=Int64),
            Field(name="extra_value", dtype=Float32),
        ],
        source=SQLiteSource(
            query="SELECT driver_id, value * 2 as extra_value, event_timestamp FROM driver_stats",
            timestamp_field="event_timestamp",
        ),
    )

    fs.apply([driver_extra_stats])

    entity_df = pd.DataFrame(
        {
            "driver_id": [1],
            "event_timestamp": [datetime.utcnow()],
        }
    )

    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=[
            "driver_stats:value",
            "driver_extra_stats:extra_value",
        ],
    ).to_df()

    assert not feature_data.empty
    assert "value" in feature_data.columns
    assert "extra_value" in feature_data.columns
    assert feature_data["extra_value"].iloc[0] == feature_data["value"].iloc[0] * 2

def test_missing_data_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test with non-existent driver_id
    entity_df = pd.DataFrame(
        {
            "driver_id": [999],  # Non-existent driver
            "event_timestamp": [datetime.utcnow()],
        }
    )

    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=["driver_stats:value", "driver_stats:rating"],
    ).to_df()

    assert not feature_data.empty
    assert pd.isna(feature_data["value"].iloc[0])
    assert pd.isna(feature_data["rating"].iloc[0])

def test_data_type_validation(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test with string data in numeric column
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE invalid_types (
                driver_id INTEGER,
                value TEXT,  # Invalid type for numeric column
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO invalid_types VALUES (1, 'not_a_number', '2024-01-01 12:00:00')
        """)
        conn.commit()

        invalid_view = FeatureView(
            name="invalid_types",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),  # Should be Float32 but data is text
            ],
            source=SQLiteSource(
                table="invalid_types",
                timestamp_field="event_timestamp",
            ),
        )

        with pytest.raises(Exception):
            fs.apply([invalid_view])

        conn.close()

def test_large_query_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create a large number of entity rows
    num_rows = 10000
    entity_df = pd.DataFrame(
        {
            "driver_id": list(range(num_rows)),
            "event_timestamp": [datetime.utcnow()] * num_rows,
        }
    )

    # This should handle the large query without memory issues
    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=["driver_stats:value"],
    ).to_df()

    assert len(feature_data) == num_rows

def test_concurrent_access(feature_store):
    fs, driver_stats_view, driver = feature_store

    import queue
    import threading

    results = queue.Queue()
    errors = queue.Queue()

    def worker():
        try:
            entity_df = pd.DataFrame(
                {
                    "driver_id": [1],
                    "event_timestamp": [datetime.utcnow()],
                }
            )
            feature_data = fs.get_historical_features(
                entity_df=entity_df,
                features=["driver_stats:value"],
            ).to_df()
            results.put(feature_data)
        except Exception as e:
            errors.put(e)

    # Create multiple threads to access SQLite concurrently
    threads = []
    num_threads = 5
    for _ in range(num_threads):
        t = threading.Thread(target=worker)
        threads.append(t)
        t.start()

    # Wait for all threads to complete
    for t in threads:
        t.join()

    # Check for errors
    assert errors.empty(), f"Concurrent access errors: {list(errors.queue)}"

    # Verify results
    while not results.empty():
        result = results.get()
        assert not result.empty
        assert "value" in result.columns

def test_transaction_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test transaction rollback
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        try:
            cursor.execute("BEGIN TRANSACTION")
            cursor.execute("""
                CREATE TABLE test_transaction (
                    driver_id INTEGER,
                    value REAL,
                    event_timestamp DATETIME
                )
            """)
            cursor.execute("""
                INSERT INTO test_transaction VALUES (1, 1.1, '2024-01-01 12:00:00')
            """)
            # Intentionally cause an error
            cursor.execute("SELECT * FROM nonexistent_table")
            cursor.execute("COMMIT")
        except Exception:
            cursor.execute("ROLLBACK")

        # Verify table doesn't exist after rollback
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='test_transaction'")
        assert cursor.fetchone() is None

        conn.close()

def test_query_timeout(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create a long-running query
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name, timeout=0.1)  # Very short timeout
        cursor = conn.cursor()

        # Create and fill a large table
        cursor.execute("CREATE TABLE test_timeout (id INTEGER, value REAL)")
        cursor.executemany(
            "INSERT INTO test_timeout VALUES (?, ?)",
            [(i, i * 1.0) for i in range(100000)]
        )
        conn.commit()

        # Hold a lock on the database
        cursor.execute("BEGIN EXCLUSIVE")

        # Try to access the database from another connection
        with pytest.raises(Exception):
            conn2 = sqlite3.connect(temp_db.name, timeout=0.1)
            cursor2 = conn2.cursor()
            cursor2.execute("SELECT * FROM test_timeout")

        conn.close()

def test_invalid_sql_query(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test with invalid SQL syntax
    invalid_view = FeatureView(
        name="invalid_query",
        entities=[Entity(name="driver", join_keys=["driver_id"])],
        schema=[
            Field(name="driver_id", dtype=Int64),
            Field(name="value", dtype=Float32),
        ],
        source=SQLiteSource(
            query="SELECT FROM invalid syntax",
            timestamp_field="event_timestamp",
        ),
    )

    with pytest.raises(Exception):
        fs.apply([invalid_view])

def test_schema_validation(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test schema mismatch
    mismatched_view = FeatureView(
        name="schema_mismatch",
        entities=[Entity(name="driver", join_keys=["driver_id"])],
        schema=[
            Field(name="nonexistent_field", dtype=Int64),  # Field doesn't exist in source
            Field(name="value", dtype=Float32),
        ],
        source=SQLiteSource(
            table="driver_stats",
            timestamp_field="event_timestamp",
        ),
    )

    with pytest.raises(Exception):
        fs.apply([mismatched_view])

def test_null_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create test data with NULL values
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE null_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO null_test VALUES
            (1, NULL, '2024-01-01 12:00:00'),
            (2, 2.2, NULL),
            (3, 3.3, '2024-01-01 12:00:00')
        """)
        conn.commit()

        null_view = FeatureView(
            name="null_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="null_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([null_view])

        entity_df = pd.DataFrame(
            {
                "driver_id": [1, 2, 3],
                "event_timestamp": [datetime.utcnow()] * 3,
            }
        )

        feature_data = fs.get_historical_features(
            entity_df=entity_df,
            features=["null_test:value"],
        ).to_df()

        assert pd.isna(feature_data["value"].iloc[0])  # NULL value
        assert feature_data["value"].iloc[2] == 3.3    # Non-NULL value

        conn.close()

def test_datetime_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create test data with various datetime formats
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE datetime_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME,
                date_only DATE,
                time_only TIME
            )
        """)
        cursor.execute("""
            INSERT INTO datetime_test VALUES
            (1, 1.1, '2024-01-01 12:00:00', '2024-01-01', '12:00:00'),
            (2, 2.2, '2024-01-01 13:00:00', '2024-01-02', '13:00:00'),
            (3, 3.3, '2024-01-01 14:00:00', '2024-01-03', '14:00:00')
        """)
        conn.commit()

        datetime_view = FeatureView(
            name="datetime_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="datetime_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([datetime_view])

        # Test with different datetime formats in entity_df
        entity_df = pd.DataFrame(
            {
                "driver_id": [1, 2, 3],
                "event_timestamp": pd.to_datetime([
                    "2024-01-01 12:00:00",
                    "2024-01-01T13:00:00",  # ISO format
                    "2024-01-01 14:00:00+00:00"  # With timezone
                ]),
            }
        )

        feature_data = fs.get_historical_features(
            entity_df=entity_df,
            features=["datetime_test:value"],
        ).to_df()

        assert len(feature_data) == 3
        assert feature_data["value"].iloc[0] == 1.1
        assert feature_data["value"].iloc[1] == 2.2
        assert feature_data["value"].iloc[2] == 3.3

        conn.close()

def test_timezone_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test with timezone-aware timestamps
    entity_df = pd.DataFrame(
        {
            "driver_id": [1],
            "event_timestamp": [pd.Timestamp("2024-01-01 12:00:00+00:00")],  # UTC
        }
    )

    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=["driver_stats:value"],
    ).to_df()

    assert not feature_data.empty
    assert "value" in feature_data.columns

    # Test with different timezone
    entity_df_pst = pd.DataFrame(
        {
            "driver_id": [1],
            "event_timestamp": [pd.Timestamp("2024-01-01 12:00:00-08:00")],  # PST
        }
    )

    feature_data_pst = fs.get_historical_features(
        entity_df=entity_df_pst,
        features=["driver_stats:value"],
    ).to_df()

    assert not feature_data_pst.empty
    assert "value" in feature_data_pst.columns

def test_feature_persistence(feature_store):
    fs, driver_stats_view, driver = feature_store

    entity_df = pd.DataFrame(
        {
            "driver_id": [1, 2],
            "event_timestamp": [
                datetime.utcnow() - timedelta(days=1),
                datetime.utcnow(),
            ],
        }
    )

    # Get features and persist them
    job = fs.get_historical_features(
        entity_df=entity_df,
        features=["driver_stats:value", "driver_stats:rating"],
    )

    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        persisted_path = temp_db.name
        storage = SavedDatasetStorage()
        job.persist(storage)
        # Verify persisted data
        conn = sqlite3.connect(persisted_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM persisted_features")
        data = cursor.fetchall()
        conn.close()

        assert len(data) == len(entity_df)
        assert "value" in [desc[0] for desc in cursor.description]
        assert "rating" in [desc[0] for desc in cursor.description]

def test_cleanup(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create temporary tables
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE temp_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO temp_test VALUES (1, 1.1, '2024-01-01 12:00:00')
        """)
        conn.commit()

        temp_view = FeatureView(
            name="temp_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="temp_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([temp_view])

        # Delete the feature view
        fs.delete_feature_view(name="temp_test")

        # Verify table still exists but feature view is gone
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='temp_test'")
        assert cursor.fetchone() is not None

        with pytest.raises(Exception):
            fs.get_feature_view("temp_test")

        conn.close()

def test_feature_inference(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create test data with various types
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE inference_test (
                driver_id INTEGER,
                int_value INTEGER,
                float_value REAL,
                text_value TEXT,
                bool_value BOOLEAN,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO inference_test VALUES
            (1, 42, 3.14, 'test', 1, '2024-01-01 12:00:00')
        """)
        conn.commit()

        inference_view = FeatureView(
            name="inference_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[],  # Empty schema for inference
            source=SQLiteSource(
                table="inference_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([inference_view])

        # Verify inferred schema
        inferred_view = fs.get_feature_view("inference_test")
        schema_fields = {field.name: field.dtype for field in inferred_view.schema}

        assert schema_fields["int_value"] == Int64
        assert schema_fields["float_value"] == Float32
        assert schema_fields["text_value"] == String
        assert schema_fields["bool_value"] == Int64  # SQLite BOOLEAN is stored as INTEGER

        conn.close()

def test_materialization(feature_store):
    fs, driver_stats_view, driver = feature_store
    # Test materialization to online store
    _ = pd.DataFrame(
        {
            "driver_id": [1, 2],
            "event_timestamp": [
                datetime.utcnow() - timedelta(days=1),
                datetime.utcnow(),
            ],
        }
    )

    fs.materialize(
        start_date=datetime.utcnow() - timedelta(days=2),
        end_date=datetime.utcnow(),
    )

    # Verify materialized features
    online_features = fs.get_online_features(
        features=[
            "driver_stats:value",
            "driver_stats:rating",
        ],
        entity_rows=[{"driver_id": 1}, {"driver_id": 2}],
    ).to_dict()

    assert "driver_stats__value" in online_features
    assert "driver_stats__rating" in online_features
    assert len(online_features["driver_stats__value"]) == 2

def test_incremental_materialization(feature_store):
    fs, driver_stats_view, driver = feature_store
    now = datetime.utcnow()
    # Initial materialization
    fs.materialize(
        start_date=now - timedelta(days=2),
        end_date=now - timedelta(days=1),
    )

    # Add new data
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE new_data (
                driver_id INTEGER,
                value REAL,
                rating REAL,
                status TEXT,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO new_data VALUES
            (1, 4.4, 4.8, 'active', ?)
        """, (now.strftime("%Y-%m-%d %H:%M:%S"),))
        conn.commit()

        new_data_view = FeatureView(
            name="new_data",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
                Field(name="rating", dtype=Float32),
                Field(name="status", dtype=String),
            ],
            source=SQLiteSource(
                table="new_data",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([new_data_view])

        # Incremental materialization
        fs.materialize_incremental(end_date=now)

        # Verify new data is materialized
        online_features = fs.get_online_features(
            features=[
                "new_data:value",
                "new_data:rating",
            ],
            entity_rows=[{"driver_id": 1}],
        ).to_dict()

        assert online_features["new_data__value"][0] == 4.4
        assert online_features["new_data__rating"][0] == 4.8

        conn.close()

def test_feature_view_update(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create initial feature view
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE update_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO update_test VALUES (1, 1.1, '2024-01-01 12:00:00')
        """)
        conn.commit()

        initial_view = FeatureView(
            name="update_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="update_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([initial_view])

        # Update feature view with new schema
        cursor.execute("ALTER TABLE update_test ADD COLUMN new_value REAL")
        cursor.execute("UPDATE update_test SET new_value = 2.2")
        conn.commit()

        updated_view = FeatureView(
            name="update_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
                Field(name="new_value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="update_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([updated_view])

        # Verify updated schema
        feature_data = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": [1],
                "event_timestamp": [datetime.utcnow()],
            }),
            features=["update_test:value", "update_test:new_value"],
        ).to_df()

        assert "value" in feature_data.columns
        assert "new_value" in feature_data.columns
        assert feature_data["new_value"].iloc[0] == 2.2

        conn.close()

def test_feature_joins(feature_store):
    fs, driver_stats_view, driver = feature_store
    # Create test data with multiple tables
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        # Create driver stats table
        cursor.execute("""
            CREATE TABLE driver_stats_join (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO driver_stats_join VALUES
            (1, 1.1, '2024-01-01 12:00:00'),
            (2, 2.2, '2024-01-01 12:00:00')
        """)

        # Create driver info table
        cursor.execute("""
            CREATE TABLE driver_info (
                driver_id INTEGER,
                rating REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO driver_info VALUES
            (1, 4.5, '2024-01-01 12:00:00'),
            (2, 4.8, '2024-01-01 12:00:00')
        """)
        conn.commit()

        # Create feature views
        stats_view = FeatureView(
            name="driver_stats_join",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="driver_stats_join",
                timestamp_field="event_timestamp",
            ),
        )

        info_view = FeatureView(
            name="driver_info",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="rating", dtype=Float32),
            ],
            source=SQLiteSource(
                table="driver_info",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([stats_view, info_view])

        # Test joining features from both views
        entity_df = pd.DataFrame(
            {
                "driver_id": [1, 2],
                "event_timestamp": [datetime.utcnow()] * 2,
            }
        )

        feature_data = fs.get_historical_features(
            entity_df=entity_df,
            features=[
                "driver_stats_join:value",
                "driver_info:rating",
            ],
        ).to_df()

        assert len(feature_data) == 2
        assert "value" in feature_data.columns
        assert "rating" in feature_data.columns
        assert feature_data["value"].iloc[0] == 1.1
        assert feature_data["rating"].iloc[0] == 4.5

        conn.close()

def test_feature_aggregations(feature_store):
    fs, driver_stats_view, driver = feature_store
    # Create test data with multiple events per driver
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE driver_events (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO driver_events VALUES
            (1, 1.0, '2024-01-01 12:00:00'),
            (1, 2.0, '2024-01-01 12:30:00'),
            (1, 3.0, '2024-01-01 13:00:00'),
            (2, 4.0, '2024-01-01 12:00:00'),
            (2, 5.0, '2024-01-01 12:30:00')
        """)
        conn.commit()

        events_view = FeatureView(
            name="driver_events",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                query="""
                    SELECT
                        driver_id,
                        AVG(value) as avg_value,
                        MAX(value) as max_value,
                        COUNT(*) as event_count,
                        event_timestamp
                    FROM driver_events
                    GROUP BY driver_id, event_timestamp
                """,
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([events_view])

        # Test aggregated features
        entity_df = pd.DataFrame(
            {
                "driver_id": [1, 2],
                "event_timestamp": [datetime.utcnow()] * 2,
            }
        )

        feature_data = fs.get_historical_features(
            entity_df=entity_df,
            features=[
                "driver_events:avg_value",
                "driver_events:max_value",
                "driver_events:event_count",
            ],
        ).to_df()

        assert len(feature_data) == 2
        assert "avg_value" in feature_data.columns
        assert "max_value" in feature_data.columns
        assert "event_count" in feature_data.columns

        # Verify aggregations for driver 1
        assert feature_data[feature_data["driver_id"] == 1]["avg_value"].iloc[0] == 2.0
        assert feature_data[feature_data["driver_id"] == 1]["max_value"].iloc[0] == 3.0
        assert feature_data[feature_data["driver_id"] == 1]["event_count"].iloc[0] == 3

        conn.close()

def test_on_demand_feature_view(feature_store):
    fs, driver_stats_view, driver = feature_store
    # Create an on-demand feature view
    from feast import RequestSource

    request_source = RequestSource(
        name="driver_request",
        schema=[
            Field(name="driver_id", dtype=Int64),
            Field(name="request_value", dtype=Float32),
        ],
    )

    @on_demand_feature_view(
        sources=[request_source, driver_stats_view],
        schema=[
            Field(name="scaled_value", dtype=Float32),
        ],
    )
    def driver_scaled_value(inputs: pd.DataFrame) -> pd.DataFrame:
        df = pd.DataFrame()
        df["scaled_value"] = inputs["request_value"] * inputs["value"]
        return df

    fs.apply([driver_scaled_value])

    # Test on-demand feature view
    entity_df = pd.DataFrame(
        {
            "driver_id": [1],
            "request_value": [2.0],
            "event_timestamp": [datetime.utcnow()],
        }
    )

    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=[
            "driver_stats:value",
            "driver_scaled_value:scaled_value",
        ],
    ).to_df()

    assert "scaled_value" in feature_data.columns
    assert feature_data["scaled_value"].iloc[0] == feature_data["value"].iloc[0] * 2.0

def test_feature_service(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Create a feature service
    from feast import FeatureService

    service = FeatureService(
        name="driver_activity_service",
        features=[
            driver_stats_view[["value", "rating"]],
        ],
    )

    fs.apply([service])

    # Test feature service retrieval
    entity_df = pd.DataFrame(
        {
            "driver_id": [1, 2],
            "event_timestamp": [datetime.utcnow()] * 2,
        }
    )

    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=service,
    ).to_df()

    assert len(feature_data) == 2
    assert "value" in feature_data.columns
    assert "rating" in feature_data.columns

def test_error_handling(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test invalid SQL query
    with pytest.raises(Exception):
        fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": [1],
                "event_timestamp": [datetime.utcnow()],
            }),
            features=[
                "nonexistent_view:value",
            ],
        )

    # Test invalid feature reference
    with pytest.raises(Exception):
        fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": [1],
                "event_timestamp": [datetime.utcnow()],
            }),
            features=[
                "driver_stats:nonexistent_feature",
            ],
        )

    # Test invalid entity key
    with pytest.raises(Exception):
        fs.get_historical_features(
            entity_df=pd.DataFrame({
                "nonexistent_id": [1],
                "event_timestamp": [datetime.utcnow()],
            }),
            features=[
                "driver_stats:value",
            ],
        )

def test_edge_cases(feature_store):
    fs, driver_stats_view, driver = feature_store

    # Test empty entity DataFrame
    feature_data = fs.get_historical_features(
        entity_df=pd.DataFrame({
            "driver_id": [],
            "event_timestamp": [],
        }),
        features=[
            "driver_stats:value",
        ],
    ).to_df()

    assert len(feature_data) == 0

    # Test large number of entity rows
    large_entity_df = pd.DataFrame({
        "driver_id": list(range(10000)),
        "event_timestamp": [datetime.utcnow()] * 10000,
    })

    feature_data = fs.get_historical_features(
        entity_df=large_entity_df,
        features=[
            "driver_stats:value",
        ],
    ).to_df()

    assert len(feature_data) == 10000

    # Test duplicate entity rows
    duplicate_entity_df = pd.DataFrame({
        "driver_id": [1, 1, 1],
        "event_timestamp": [datetime.utcnow()] * 3,
    })

    feature_data = fs.get_historical_features(
        entity_df=duplicate_entity_df,
        features=[
            "driver_stats:value",
        ],
    ).to_df()

    assert len(feature_data) == 3

def test_data_validation(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE validation_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)

        # Test invalid data types
        with pytest.raises(Exception):
            cursor.execute("""
                INSERT INTO validation_test VALUES
                ('not_an_integer', 1.0, '2024-01-01 12:00:00')
            """)

        # Test invalid datetime format
        with pytest.raises(Exception):
            cursor.execute("""
                INSERT INTO validation_test VALUES
                (1, 1.0, 'invalid_datetime')
            """)

        # Test valid data
        cursor.execute("""
            INSERT INTO validation_test VALUES (1, 1.0, '2024-01-01 12:00:00')
        """)
        conn.commit()

        validation_view = FeatureView(
            name="validation_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="validation_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([validation_view])

        # Test data retrieval with valid data
        feature_data = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": [1],
                "event_timestamp": [datetime.utcnow()],
            }),
            features=["validation_test:value"],
        ).to_df()

        assert len(feature_data) == 1
        assert feature_data["value"].iloc[0] == 1.0

        conn.close()

def test_schema_evolution(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        # Initial schema
        cursor.execute("""
            CREATE TABLE evolution_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)
        cursor.execute("""
            INSERT INTO evolution_test VALUES (1, 1.0, '2024-01-01 12:00:00')
        """)
        conn.commit()

        initial_view = FeatureView(
            name="evolution_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="evolution_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([initial_view])

        # Add new column
        cursor.execute("ALTER TABLE evolution_test ADD COLUMN status TEXT")
        cursor.execute("UPDATE evolution_test SET status = 'active'")

        # Add column with default value
        cursor.execute("ALTER TABLE evolution_test ADD COLUMN rating REAL DEFAULT 5.0")
        conn.commit()

        evolved_view = FeatureView(
            name="evolution_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
                Field(name="status", dtype=String),
                Field(name="rating", dtype=Float32),
            ],
            source=SQLiteSource(
                table="evolution_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([evolved_view])

        # Test data retrieval with evolved schema
        feature_data = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": [1],
                "event_timestamp": [datetime.utcnow()],
            }),
            features=[
                "evolution_test:value",
                "evolution_test:status",
                "evolution_test:rating",
            ],
        ).to_df()

        assert len(feature_data) == 1
        assert feature_data["value"].iloc[0] == 1.0
        assert feature_data["status"].iloc[0] == "active"
        assert feature_data["rating"].iloc[0] == 5.0

        conn.close()

def test_data_partitioning(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        # Create partitioned data by date
        cursor.execute("""
            CREATE TABLE partitioned_data (
                driver_id INTEGER,
                value REAL,
                partition_date DATE,
                event_timestamp DATETIME
            )
        """)

        # Insert data for different dates
        dates = [
            '2024-01-01',
            '2024-01-02',
            '2024-01-03'
        ]

        for date in dates:
            cursor.execute(f"""
                INSERT INTO partitioned_data VALUES
                (1, 1.0, '{date}', '{date} 12:00:00'),
                (2, 2.0, '{date}', '{date} 12:00:00')
            """)
        conn.commit()

        partitioned_view = FeatureView(
            name="partitioned_data",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                query="""
                    SELECT
                        driver_id,
                        value,
                        event_timestamp
                    FROM partitioned_data
                    WHERE partition_date BETWEEN :start_date AND :end_date
                """,
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([partitioned_view])

        # Test data retrieval with date range
        feature_data = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": [1, 2],
                "event_timestamp": [datetime.strptime('2024-01-02', '%Y-%m-%d')] * 2,
            }),
            features=["partitioned_data:value"],
        ).to_df()

        assert len(feature_data) == 2
        assert feature_data["value"].tolist() == [1.0, 2.0]

        conn.close()

def test_performance_monitoring(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        # Enable SQLite query performance monitoring
        cursor.execute("PRAGMA query_plan_enabled = ON")

        # Create test data
        cursor.execute("""
            CREATE TABLE performance_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)

        # Insert test data
        for i in range(1000):
            cursor.execute(f"""
                INSERT INTO performance_test VALUES
                ({i}, {i * 1.0}, '2024-01-01 12:00:00')
            """)
        conn.commit()

        # Create index for better performance
        cursor.execute("""
            CREATE INDEX idx_driver_id_timestamp
            ON performance_test(driver_id, event_timestamp)
        """)

        performance_view = FeatureView(
            name="performance_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="performance_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([performance_view])

        # Test query performance with and without index
        start_time = time.time()
        feature_data = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": list(range(1000)),
                "event_timestamp": [datetime.utcnow()] * 1000,
            }),
            features=["performance_test:value"],
        ).to_df()
        query_time = time.time() - start_time

        assert len(feature_data) == 1000
        assert query_time < 1.0  # Query should complete within 1 second

        # Get query execution plan
        cursor.execute("EXPLAIN QUERY PLAN SELECT * FROM performance_test")
        plan = cursor.fetchall()
        assert any("USING INDEX" in str(row) for row in plan)  # Verify index usage

        conn.close()

def test_batch_operations(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        # Create test data
        cursor.execute("""
            CREATE TABLE batch_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)

        # Prepare batch data
        batch_data = [(i, i * 1.0, '2024-01-01 12:00:00') for i in range(100)]
        cursor.executemany(
            "INSERT INTO batch_test VALUES (?, ?, ?)",
            batch_data
        )
        conn.commit()

        batch_view = FeatureView(
            name="batch_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="batch_test",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([batch_view])

        # Test batch retrieval
        entity_df = pd.DataFrame({
            "driver_id": list(range(0, 100, 10)),
            "event_timestamp": [datetime.utcnow()] * 10,
        })

        feature_data = fs.get_historical_features(
            entity_df=entity_df,
            features=["batch_test:value"],
        ).to_df()

        assert len(feature_data) == 10
        assert all(feature_data["value"] == feature_data["driver_id"] * 1.0)

        conn.close()

def test_data_consistency(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()

        # Create test tables
        cursor.execute("""
            CREATE TABLE source_data (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)

        cursor.execute("""
            CREATE TABLE target_data (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME
            )
        """)

        # Insert test data
        test_data = [(i, i * 1.0, '2024-01-01 12:00:00') for i in range(10)]
        cursor.executemany(
            "INSERT INTO source_data VALUES (?, ?, ?)",
            test_data
        )
        conn.commit()

        # Test transaction rollback
        try:
            cursor.execute("BEGIN TRANSACTION")
            cursor.executemany(
                "INSERT INTO target_data VALUES (?, ?, ?)",
                test_data
            )
            cursor.execute("INSERT INTO target_data VALUES ('invalid', 0.0, '2024-01-01')")
            cursor.execute("COMMIT")
        except Exception:
            cursor.execute("ROLLBACK")

        # Verify data consistency
        cursor.execute("SELECT COUNT(*) FROM target_data")
        count = cursor.fetchone()[0]
        assert count == 0  # Transaction should have been rolled back

        # Test successful transaction
        cursor.execute("BEGIN TRANSACTION")
        cursor.executemany(
            "INSERT INTO target_data VALUES (?, ?, ?)",
            test_data
        )
        cursor.execute("COMMIT")

        # Verify data consistency
        cursor.execute("SELECT COUNT(*) FROM target_data")
        count = cursor.fetchone()[0]
        assert count == 10  # All records should be inserted

        # Create feature views
        source_view = FeatureView(
            name="source_data",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="source_data",
                timestamp_field="event_timestamp",
            ),
        )

        target_view = FeatureView(
            name="target_data",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
            ],
            source=SQLiteSource(
                table="target_data",
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([source_view, target_view])

        # Verify feature consistency
        entity_df = pd.DataFrame({
            "driver_id": list(range(10)),
            "event_timestamp": [datetime.utcnow()] * 10,
        })

        source_features = fs.get_historical_features(
            entity_df=entity_df,
            features=["source_data:value"],
        ).to_df()

        target_features = fs.get_historical_features(
            entity_df=entity_df,
            features=["target_data:value"],
        ).to_df()

        pd.testing.assert_frame_equal(
            source_features[["value"]],
            target_features[["value"]]
        )

        conn.close()

def test_query_optimization(feature_store):
    fs, driver_stats_view, driver = feature_store
    with tempfile.NamedTemporaryFile(suffix='.db') as temp_db:
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        # Enable query optimization
        cursor.execute("PRAGMA automatic_index=ON")
        cursor.execute("PRAGMA cache_size=2000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        # Create test table with indexes
        cursor.execute("""
            CREATE TABLE optimization_test (
                driver_id INTEGER,
                value REAL,
                event_timestamp DATETIME,
                region TEXT,
                status TEXT
            )
        """)

        # Create indexes
        cursor.execute("CREATE INDEX idx_driver_ts ON optimization_test(driver_id, event_timestamp)")
        cursor.execute("CREATE INDEX idx_region ON optimization_test(region)")

        # Insert test data
        regions = ['north', 'south', 'east', 'west']
        statuses = ['active', 'inactive']
        test_data = []
        for i in range(1000):
            test_data.append((
                i,  # driver_id
                i * 1.0,  # value
                '2024-01-01 12:00:00',  # event_timestamp
                regions[i % len(regions)],  # region
                statuses[i % len(statuses)]  # status
            ))

        cursor.executemany(
            "INSERT INTO optimization_test VALUES (?, ?, ?, ?, ?)",
            test_data
        )
        conn.commit()

        # Create feature view with complex query
        optimization_view = FeatureView(
            name="optimization_test",
            entities=[Entity(name="driver", join_keys=["driver_id"])],
            schema=[
                Field(name="driver_id", dtype=Int64),
                Field(name="value", dtype=Float32),
                Field(name="region", dtype=String),
                Field(name="status", dtype=String),
            ],
            source=SQLiteSource(
                query="""
                    SELECT
                        driver_id,
                        AVG(value) as value,
                        region,
                        status,
                        event_timestamp
                    FROM optimization_test
                    WHERE region = :region
                    GROUP BY driver_id, region, status, event_timestamp
                """,
                timestamp_field="event_timestamp",
            ),
        )

        fs.apply([optimization_view])

        # Test query performance with index
        start_time = time.time()
        _ = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": list(range(100)),
                "event_timestamp": [datetime.utcnow()] * 100,
            }),
            features=[
                "optimization_test:value",
                "optimization_test:region",
                "optimization_test:status",
            ],
        ).to_df()
        query_time_with_index = time.time() - start_time

        # Drop index and test performance
        cursor.execute("DROP INDEX idx_driver_ts")
        cursor.execute("DROP INDEX idx_region")

        start_time = time.time()
        _ = fs.get_historical_features(
            entity_df=pd.DataFrame({
                "driver_id": list(range(100)),
                "event_timestamp": [datetime.utcnow()] * 100,
            }),
            features=[
                "optimization_test:value",
                "optimization_test:region",
                "optimization_test:status",
            ],
        ).to_df()
        query_time_without_index = time.time() - start_time

        # Verify index improves performance
        assert query_time_with_index < query_time_without_index

        # Get query execution plan
        cursor.execute("EXPLAIN QUERY PLAN SELECT * FROM optimization_test WHERE driver_id = 1")
        plan = cursor.fetchall()

        # Verify query plan uses appropriate strategies
        plan_str = str(plan)
        assert "SCAN" in plan_str

        conn.close()

def test_historical_retrieval(sqlite_store):
    fs, feature_view, entity = sqlite_store
    entity_df = pd.DataFrame(
        {
            "driver_id": [1, 2],
            "event_timestamp": [
                datetime.utcnow() - timedelta(days=1),
                datetime.utcnow(),
            ],
        }
    )

    feature_refs = ["driver_stats:value"]
    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=feature_refs,
    ).to_df()

    assert not feature_data.empty
    assert "value" in feature_data.columns
    assert len(feature_data) == len(entity_df)

def test_point_in_time_accuracy(sqlite_store):
    fs, feature_view, entity = sqlite_store
    entity_df = pd.DataFrame(
        {
            "driver_id": [1],
            "event_timestamp": [datetime.utcnow() - timedelta(days=1)],
        }
    )

    feature_refs = ["driver_stats:value"]
    feature_data = fs.get_historical_features(
        entity_df=entity_df,
        features=feature_refs,
    ).to_df()

    assert not feature_data.empty
    assert feature_data["value"].iloc[0] == 1.1

def test_feature_view_inference(sqlite_store):
    fs, feature_view, entity = sqlite_store
    inferred_schema = fs._get_provider().infer_features(
        [feature_view],
        entities=[entity],
        limit=10,
    )
    assert len(inferred_schema) > 0
    assert "driver_id" in inferred_schema
    assert "value" in inferred_schema
