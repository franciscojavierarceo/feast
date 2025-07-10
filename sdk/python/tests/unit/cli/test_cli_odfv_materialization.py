import tempfile
from pathlib import Path

from tests.utils.cli_repo_creator import CliRunner, get_example_repo


def test_cli_apply_with_odfv_write_to_online_store():
    """
    Test that ODFVs with write_to_online_store=True are properly included
    in materialization when using CLI apply command.
    
    This reproduces the scenario from GitHub issue #5430.
    """
    runner = CliRunner()
    
    with (
        tempfile.TemporaryDirectory() as repo_dir_name,
        tempfile.TemporaryDirectory() as data_dir_name,
    ):
        example_repo_py = get_example_repo("example_feature_repo_1.py")
        
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
                if hasattr(fv, "write_to_online_store") and getattr(fv, "write_to_online_store", False)
            ]
            assert "customer_profile_write_odfv" in odfv_names
            
            non_write_odfv_names = [
                fv.name
                for fv in feature_views_to_materialize
                if hasattr(fv, "write_to_online_store") and not getattr(fv, "write_to_online_store", False)
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
            assert getattr(specific_feature_views[0], "write_to_online_store", False) is True
