import os
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from tests.utils.cli_repo_creator import CliRunner, get_example_repo


def create_customer_profile_test_data(customers, start_date, end_date) -> pd.DataFrame:
    """Create test data matching customer_profile schema."""
    df_daily = pd.DataFrame({
        "event_timestamp": [
            pd.Timestamp(dt, unit="ms").round("ms")
            for dt in pd.date_range(start=start_date, end=end_date, freq="1D", inclusive="left", tz="UTC")
        ]
    })
    
    df_all_customers = pd.DataFrame()
    for customer in customers:
        df_daily_copy = df_daily.copy()
        df_daily_copy["customer_id"] = customer
        df_all_customers = pd.concat([df_daily_copy, df_all_customers])

    df_all_customers.reset_index(drop=True, inplace=True)
    rows = df_all_customers["event_timestamp"].count()

    df_all_customers["avg_orders_day"] = np.random.random(size=rows).astype(np.float32) * 10
    df_all_customers["name"] = [f"Customer_{i%3}" for i in range(rows)]
    df_all_customers["age"] = np.random.randint(18, 80, size=rows).astype(np.int64)
    df_all_customers["created"] = pd.to_datetime(pd.Timestamp.now(tz=None).round("ms"))
    
    return df_all_customers


def test_cli_apply_with_odfv_write_to_online_store():
    """
    Test that ODFVs with write_to_online_store=True are properly included
    in materialization when using CLI apply command and that data is
    actually written to the online store.

    This reproduces the scenario from GitHub issue #5430.
    """
    runner = CliRunner()

    with tempfile.TemporaryDirectory() as data_dir:
        end_date = datetime.now().replace(microsecond=0, second=0, minute=0)
        start_date = end_date - timedelta(days=15)
        
        customer_entities = ["customer_1", "customer_2", "customer_3"]
        customer_df = create_customer_profile_test_data(customer_entities, start_date, end_date)
        customer_profile_path = os.path.join(data_dir, "customer_profiles.parquet")
        customer_df.to_parquet(path=customer_profile_path, allow_truncated_timestamps=True)

        example_repo_py = get_example_repo("example_feature_repo_1.py").replace(
            "%CUSTOMER_PARQUET_PATH%", customer_profile_path
        )

        with runner.local_repo(
            example_repo_py=example_repo_py,
            offline_store="file",
            online_store="sqlite",
            apply=True,
            teardown=True,
        ) as store:
            feature_views_to_materialize = store._get_feature_views_to_materialize(None)

            odfv_names = [
                fv.name
                for fv in feature_views_to_materialize
                if hasattr(fv, "write_to_online_store")
                and getattr(fv, "write_to_online_store", False)
            ]
            assert "customer_profile_write_odfv" in odfv_names

            non_write_odfv_names = [
                fv.name
                for fv in feature_views_to_materialize
                if hasattr(fv, "write_to_online_store")
                and not getattr(fv, "write_to_online_store", False)
            ]
            assert "customer_profile_pandas_odfv" not in non_write_odfv_names

            regular_fv_names = [
                fv.name
                for fv in feature_views_to_materialize
                if not hasattr(fv, "write_to_online_store")
            ]
            assert "customer_profile" in regular_fv_names
            assert "driver_locations" in regular_fv_names

            specific_feature_views = store._get_feature_views_to_materialize(
                ["customer_profile_write_odfv"]
            )
            assert len(specific_feature_views) == 1
            assert specific_feature_views[0].name == "customer_profile_write_odfv"
            assert (
                getattr(specific_feature_views[0], "write_to_online_store", False)
                is True
            )

            assert store.repo_path is not None
            r = runner.run(
                [
                    "materialize",
                    start_date.isoformat(),
                    (end_date - timedelta(days=1)).isoformat(),
                ],
                cwd=Path(store.repo_path),
            )
            assert r.returncode == 0, f"stdout: {r.stdout}\n stderr: {r.stderr}"

            online_response = store.get_online_features(
                entity_rows=[{"customer_id": "customer_1"}],
                features=["customer_profile_write_odfv:age_plus_orders"],
            ).to_dict()
            
            assert "age_plus_orders" in online_response
            assert len(online_response["age_plus_orders"]) > 0
            assert online_response["age_plus_orders"][0] is not None
