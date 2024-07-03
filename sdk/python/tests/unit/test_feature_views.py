from datetime import timedelta

import pytest
from typeguard import TypeCheckError

from feast.batch_feature_view import BatchFeatureView
from feast.data_format import AvroFormat
from feast.data_source import KafkaSource
from feast.entity import Entity
from feast.feature_view import FeatureView
from feast.field import Field
from feast.infra.offline_stores.file_source import FileSource
from feast.protos.feast.types.Value_pb2 import ValueType
from feast.types import Float32
from feast.utils import _utc_now, make_tzaware


def test_create_feature_view_with_conflicting_entities():
    user1 = Entity(name="user1", join_keys=["user_id"])
    user2 = Entity(name="user2", join_keys=["user_id"])
    batch_source = FileSource(path="some path")

    with pytest.raises(ValueError):
        _ = FeatureView(
            name="test",
            entities=[user1, user2],
            ttl=timedelta(days=30),
            source=batch_source,
        )


def test_create_batch_feature_view():
    batch_source = FileSource(path="some path")
    BatchFeatureView(
        name="test batch feature view",
        entities=[],
        ttl=timedelta(days=30),
        source=batch_source,
    )

    with pytest.raises(TypeError):
        BatchFeatureView(
            name="test batch feature view", entities=[], ttl=timedelta(days=30)
        )

    stream_source = KafkaSource(
        name="kafka",
        timestamp_field="event_timestamp",
        kafka_bootstrap_servers="",
        message_format=AvroFormat(""),
        topic="topic",
        batch_source=FileSource(path="some path"),
    )
    with pytest.raises(ValueError):
        BatchFeatureView(
            name="test batch feature view",
            entities=[],
            ttl=timedelta(days=30),
            source=stream_source,
        )


def simple_udf(x: int):
    return x + 3


def test_hash():
    file_source = FileSource(name="my-file-source", path="test.parquet")
    feature_view_1 = FeatureView(
        name="my-feature-view",
        entities=[],
        schema=[
            Field(name="feature1", dtype=Float32),
            Field(name="feature2", dtype=Float32),
        ],
        source=file_source,
    )
    feature_view_2 = FeatureView(
        name="my-feature-view",
        entities=[],
        schema=[
            Field(name="feature1", dtype=Float32),
            Field(name="feature2", dtype=Float32),
        ],
        source=file_source,
    )
    feature_view_3 = FeatureView(
        name="my-feature-view",
        entities=[],
        schema=[Field(name="feature1", dtype=Float32)],
        source=file_source,
    )
    feature_view_4 = FeatureView(
        name="my-feature-view",
        entities=[],
        schema=[Field(name="feature1", dtype=Float32)],
        source=file_source,
        description="test",
    )

    s1 = {feature_view_1, feature_view_2}
    assert len(s1) == 1

    s2 = {feature_view_1, feature_view_3}
    assert len(s2) == 2

    s3 = {feature_view_3, feature_view_4}
    assert len(s3) == 2

    s4 = {feature_view_1, feature_view_2, feature_view_3, feature_view_4}
    assert len(s4) == 3


# TODO(felixwang9817): Add tests for proto conversion.
# TODO(felixwang9817): Add tests for field mapping logic.


def test_field_types():
    with pytest.raises(TypeCheckError):
        Field(name="name", dtype=ValueType.INT32)


def test_update_materialization_intervals():
    batch_source = FileSource(path="some path")
    entity = Entity(name="entity_1", description="Some entity")
    # Create a feature view that is already present in the SQL registry
    stored_feature_view = FeatureView(
        name="my-feature-view",
        entities=[entity],
        ttl=timedelta(days=1),
        source=batch_source,
    )

    # Update the Feature View without modifying anything
    updated_feature_view = FeatureView(
        name="my-feature-view",
        entities=[entity],
        ttl=timedelta(days=1),
        source=batch_source,
    )
    updated_feature_view.update_materialization_intervals(
        stored_feature_view.materialization_intervals
    )
    assert len(updated_feature_view.materialization_intervals) == 0

    current_time = _utc_now()
    start_date = make_tzaware(current_time - timedelta(days=1))
    end_date = make_tzaware(current_time)
    updated_feature_view.materialization_intervals.append((start_date, end_date))

    # Update the Feature View, i.e. simply update the name
    second_updated_feature_view = FeatureView(
        name="my-feature-view-1",
        entities=[entity],
        ttl=timedelta(days=1),
        source=batch_source,
    )

    second_updated_feature_view.update_materialization_intervals(
        updated_feature_view.materialization_intervals
    )
    assert len(second_updated_feature_view.materialization_intervals) == 1
    assert (
        second_updated_feature_view.materialization_intervals[0][0]
        == updated_feature_view.materialization_intervals[0][0]
    )
    assert (
        second_updated_feature_view.materialization_intervals[0][1]
        == updated_feature_view.materialization_intervals[0][1]
    )


def test_feature_view_transformation():
    from feast.protos.feast.core.Transformation_pb2 import FeatureTransformationV2
    import dill

    # Define a simple transformation function
    def add_one(inputs: Dict[str, Any]) -> Dict[str, Any]:
        return {"output": [x + 1 for x in inputs["input"]]}

    # Serialize the transformation function using dill
    serialized_func = dill.dumps(add_one)

    # Create a FeatureTransformationV2 message with the serialized function
    transformation_metadata = FeatureTransformationV2(
        user_defined_function=FeatureTransformationV2.UserDefinedFunction(
            body=serialized_func
        )
    )

    # Create a FeatureView with the transformation metadata
    feature_view = FeatureView(
        name="test_feature_view",
        entities=[],
        schema=[Field(name="input", dtype=Float32)],
        source=FileSource(path="some path"),
        transformation_metadata=transformation_metadata,
    )

    # Apply the transformation
    input_data = {"input": [1, 2, 3]}
    transformed_data = feature_view.materialize(input_data)

    # Assert the transformation output
    assert transformed_data == {"output": [2, 3, 4]}


def test_feature_view_ibis_transformation():
    from feast.protos.feast.core.Transformation_pb2 import FeatureTransformationV2, SubstraitTransformation
    import ibis
    import pandas as pd

    # Define a simple Ibis transformation expression
    def add_one(table):
        return table.mutate(output=table["input"] + 1)

    # Create a DataFrame and convert it to an Ibis table
    df = pd.DataFrame({"input": [1, 2, 3]})
    ibis_table = ibis.pandas.connect({"table": df}).table("table")

    # Serialize the Ibis expression
    serialized_expr = ibis_table.compile().to_bytes()

    # Create a SubstraitTransformation message with the serialized expression
    transformation_metadata = FeatureTransformationV2(
        substrait=SubstraitTransformation(
            ibis_expr=serialized_expr
        )
    )

    # Create a FeatureView with the transformation metadata
    feature_view = FeatureView(
        name="test_feature_view_ibis",
        entities=[],
        schema=[Field(name="input", dtype=Float32)],
        source=FileSource(path="some path"),
        transformation_metadata=transformation_metadata,
    )

    # Apply the transformation
    input_data = {"input": [1, 2, 3]}
    transformed_data = feature_view.materialize(input_data)

    # Assert the transformation output
    assert transformed_data == {"output": [2, 3, 4]}
