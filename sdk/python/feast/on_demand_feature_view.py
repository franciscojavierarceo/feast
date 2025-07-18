import copy
import functools
import warnings
from types import FunctionType
from typing import Any, List, Optional, Union, cast

import dill
import pyarrow
from typeguard import typechecked

from feast.base_feature_view import BaseFeatureView
from feast.data_source import RequestSource
from feast.entity import Entity
from feast.errors import RegistryInferenceFailure, SpecifiedFeaturesNotPresentError
from feast.feature_view import DUMMY_ENTITY_NAME, FeatureView
from feast.feature_view_projection import FeatureViewProjection
from feast.field import Field, from_value_type
from feast.protos.feast.core.OnDemandFeatureView_pb2 import (
    OnDemandFeatureView as OnDemandFeatureViewProto,
)
from feast.protos.feast.core.OnDemandFeatureView_pb2 import (
    OnDemandFeatureViewMeta,
    OnDemandFeatureViewSpec,
    OnDemandSource,
)
from feast.protos.feast.core.Transformation_pb2 import (
    FeatureTransformationV2 as FeatureTransformationProto,
)
from feast.protos.feast.core.Transformation_pb2 import (
    UserDefinedFunctionV2 as UserDefinedFunctionProto,
)
from feast.transformation.base import Transformation
from feast.transformation.mode import TransformationMode
from feast.transformation.pandas_transformation import PandasTransformation
from feast.transformation.python_transformation import PythonTransformation
from feast.transformation.substrait_transformation import SubstraitTransformation
from feast.utils import _utc_now
from feast.value_type import ValueType

warnings.simplefilter("once", DeprecationWarning)
OnDemandSourceType = Union[FeatureView, FeatureViewProjection, RequestSource]


@typechecked
class OnDemandFeatureView(BaseFeatureView):
    """
    [Experimental] An OnDemandFeatureView defines a logical group of features that are
    generated by applying a transformation on a set of input sources, such as feature
    views and request data sources.

    Attributes:
        name: The unique name of the on demand feature view.
        features: The list of features in the output of the on demand feature view.
        source_feature_view_projections: A map from input source names to actual input
            sources with type FeatureViewProjection.
        source_request_sources: A map from input source names to the actual input
            sources with type RequestSource.
        feature_transformation: The user defined transformation.
        description: A human-readable description.
        tags: A dictionary of key-value pairs to store arbitrary metadata.
        owner: The owner of the on demand feature view, typically the email of the primary
            maintainer.
    """

    name: str
    entities: Optional[List[str]]
    features: List[Field]
    source_feature_view_projections: dict[str, FeatureViewProjection]
    source_request_sources: dict[str, RequestSource]
    feature_transformation: Transformation
    mode: str
    description: str
    tags: dict[str, str]
    owner: str
    write_to_online_store: bool
    singleton: bool
    udf: Optional[FunctionType]
    udf_string: Optional[str]

    def __init__(  # noqa: C901
        self,
        *,
        name: str,
        entities: Optional[List[Entity]] = None,
        schema: Optional[List[Field]] = None,
        sources: List[OnDemandSourceType],
        udf: Optional[FunctionType] = None,
        udf_string: Optional[str] = "",
        feature_transformation: Optional[Transformation] = None,
        mode: str = "pandas",
        description: str = "",
        tags: Optional[dict[str, str]] = None,
        owner: str = "",
        write_to_online_store: bool = False,
        singleton: bool = False,
    ):
        """
        Creates an OnDemandFeatureView object.

        Args:
            name: The unique name of the on demand feature view.
            entities (optional): The list of names of entities that this feature view is associated with.
            schema: The list of features in the output of the on demand feature view, after
                the transformation has been applied.
            sources: A map from input source names to the actual input sources, which may be
                feature views, or request data sources. These sources serve as inputs to the udf,
                which will refer to them by name.
            udf: The user defined transformation function, which must take pandas
                dataframes as inputs.
            udf_string: The source code version of the udf (for diffing and displaying in Web UI)
            feature_transformation: The user defined transformation.
            mode: Mode of execution (e.g., Pandas or Python native)
            description (optional): A human-readable description.
            tags (optional): A dictionary of key-value pairs to store arbitrary metadata.
            owner (optional): The owner of the on demand feature view, typically the email
                of the primary maintainer.
            write_to_online_store (optional): A boolean that indicates whether to write the on demand feature view to
            the online store for faster retrieval.
            singleton (optional): A boolean that indicates whether the transformation is executed on a singleton
                (only applicable when mode="python").
        """
        super().__init__(
            name=name,
            features=schema,
            description=description,
            tags=tags,
            owner=owner,
        )

        schema = schema or []
        self.entities = [e.name for e in entities] if entities else [DUMMY_ENTITY_NAME]
        self.sources = sources
        self.mode = mode.lower()
        self.udf = udf
        self.udf_string = udf_string
        self.source_feature_view_projections: dict[str, FeatureViewProjection] = {}
        self.source_request_sources: dict[str, RequestSource] = {}
        for odfv_source in sources:
            if isinstance(odfv_source, RequestSource):
                self.source_request_sources[odfv_source.name] = odfv_source
            elif isinstance(odfv_source, FeatureViewProjection):
                self.source_feature_view_projections[odfv_source.name] = odfv_source

            else:
                self.source_feature_view_projections[odfv_source.name] = (
                    odfv_source.projection
                )

        features: List[Field] = []
        self.entity_columns = []

        join_keys: List[str] = []
        if entities:
            for entity in entities:
                join_keys.append(entity.join_key)
        # Ensure that entities have unique join keys.
        if len(set(join_keys)) < len(join_keys):
            raise ValueError(
                "A feature view should not have entities that share a join key."
            )

        for field in schema:
            if field.name in join_keys:
                self.entity_columns.append(field)

                # Confirm that the inferred type matches the specified entity type, if it exists.
                matching_entities = (
                    [e for e in entities if e.join_key == field.name]
                    if entities
                    else []
                )
                assert len(matching_entities) == 1
                entity = matching_entities[0]
                if entity.value_type != ValueType.UNKNOWN:
                    if from_value_type(entity.value_type) != field.dtype:
                        raise ValueError(
                            f"Entity {entity.name} has type {entity.value_type}, which does not match the inferred type {field.dtype}."
                        )
            else:
                features.append(field)

        self.features = features
        self.feature_transformation = (
            feature_transformation or self.get_feature_transformation()
        )
        self.write_to_online_store = write_to_online_store
        self.singleton = singleton
        if self.singleton and self.mode != "python":
            raise ValueError("Singleton is only supported for Python mode.")

    def get_feature_transformation(self) -> Transformation:
        if not self.udf:
            raise ValueError(
                "Either udf or feature_transformation must be provided to create an OnDemandFeatureView"
            )
        if self.mode in (
            TransformationMode.PANDAS,
            TransformationMode.PYTHON,
        ) or self.mode in ("pandas", "python"):
            return Transformation(
                mode=self.mode, udf=self.udf, udf_string=self.udf_string or ""
            )
        elif self.mode == TransformationMode.SUBSTRAIT or self.mode == "substrait":
            return SubstraitTransformation.from_ibis(self.udf, self.sources)
        else:
            raise ValueError(
                f"Unsupported transformation mode: {self.mode} for OnDemandFeatureView"
            )

    @property
    def proto_class(self) -> type[OnDemandFeatureViewProto]:
        return OnDemandFeatureViewProto

    def __copy__(self):
        fv = OnDemandFeatureView(
            name=self.name,
            schema=self.features,
            sources=list(self.source_feature_view_projections.values())
            + list(self.source_request_sources.values()),
            feature_transformation=self.feature_transformation,
            mode=self.mode,
            description=self.description,
            tags=self.tags,
            owner=self.owner,
            write_to_online_store=self.write_to_online_store,
            singleton=self.singleton,
        )
        fv.entities = self.entities
        fv.features = self.features
        fv.projection = copy.copy(self.projection)
        fv.entity_columns = copy.copy(self.entity_columns)

        return fv

    def __eq__(self, other):
        if not isinstance(other, OnDemandFeatureView):
            raise TypeError(
                "Comparisons should only involve OnDemandFeatureView class objects."
            )

        # Note, no longer evaluating the base feature view layer as ODFVs can have
        # multiple datasources and a base_feature_view only has one source
        # though maybe that shouldn't be true
        if (
            self.source_feature_view_projections
            != other.source_feature_view_projections
            or self.description != other.description
            or self.source_request_sources != other.source_request_sources
            or self.mode != other.mode
            or self.feature_transformation != other.feature_transformation
            or self.write_to_online_store != other.write_to_online_store
            or sorted(self.entity_columns) != sorted(other.entity_columns)
            or self.singleton != other.singleton
        ):
            return False

        return True

    @property
    def join_keys(self) -> List[str]:
        """Returns a list of all the join keys."""
        return [entity.name for entity in self.entity_columns]

    @property
    def schema(self) -> List[Field]:
        return list(set(self.entity_columns + self.features))

    def ensure_valid(self):
        """
        Validates the state of this feature view locally.

        Raises:
            ValueError: The On Demand feature view does not have an entity when trying to use write_to_online_store.
        """
        super().ensure_valid()

        if self.write_to_online_store and not self.entities:
            raise ValueError(
                "On Demand Feature views require an entity if write_to_online_store=True"
            )

    def __hash__(self):
        return super().__hash__()

    def to_proto(self) -> OnDemandFeatureViewProto:
        """
        Converts an on demand feature view object to its protobuf representation.

        Returns:
            A OnDemandFeatureViewProto protobuf.
        """
        meta = OnDemandFeatureViewMeta()
        if self.created_timestamp:
            meta.created_timestamp.FromDatetime(self.created_timestamp)
        if self.last_updated_timestamp:
            meta.last_updated_timestamp.FromDatetime(self.last_updated_timestamp)
        sources = {}
        for source_name, fv_projection in self.source_feature_view_projections.items():
            sources[source_name] = OnDemandSource(
                feature_view_projection=fv_projection.to_proto(),
            )
        for (
            source_name,
            request_sources,
        ) in self.source_request_sources.items():
            sources[source_name] = OnDemandSource(
                request_data_source=request_sources.to_proto()
            )

        user_defined_function_proto = cast(
            UserDefinedFunctionProto,
            self.feature_transformation.to_proto()
            if isinstance(
                self.feature_transformation,
                (PandasTransformation, PythonTransformation),
            )
            else None,
        )

        substrait_transformation_proto = (
            self.feature_transformation.to_proto()
            if isinstance(self.feature_transformation, SubstraitTransformation)
            else None
        )

        feature_transformation = FeatureTransformationProto(
            user_defined_function=user_defined_function_proto,
            substrait_transformation=substrait_transformation_proto,
        )
        spec = OnDemandFeatureViewSpec(
            name=self.name,
            entities=self.entities if self.entities else None,
            entity_columns=[
                field.to_proto() for field in self.entity_columns if self.entity_columns
            ],
            features=[feature.to_proto() for feature in self.features],
            sources=sources,
            feature_transformation=feature_transformation,
            mode=self.mode,
            description=self.description,
            tags=self.tags,
            owner=self.owner,
            write_to_online_store=self.write_to_online_store,
            singleton=self.singleton if self.singleton else False,
        )
        return OnDemandFeatureViewProto(spec=spec, meta=meta)

    @classmethod
    def from_proto(
        cls,
        on_demand_feature_view_proto: OnDemandFeatureViewProto,
        skip_udf: bool = False,
    ):
        """
        Creates an on demand feature view from a protobuf representation.

        Args:
            on_demand_feature_view_proto: A protobuf representation of an on-demand feature view.
            skip_udf: A boolean indicating whether to skip loading the udf

        Returns:
            A OnDemandFeatureView object based on the on-demand feature view protobuf.
        """
        sources = []
        for (
            _,
            on_demand_source,
        ) in on_demand_feature_view_proto.spec.sources.items():
            if on_demand_source.WhichOneof("source") == "feature_view":
                sources.append(
                    FeatureView.from_proto(on_demand_source.feature_view).projection
                )
            elif on_demand_source.WhichOneof("source") == "feature_view_projection":
                sources.append(
                    FeatureViewProjection.from_proto(
                        on_demand_source.feature_view_projection
                    )
                )
            else:
                sources.append(
                    RequestSource.from_proto(on_demand_source.request_data_source)
                )

        if (
            on_demand_feature_view_proto.spec.feature_transformation.WhichOneof(
                "transformation"
            )
            == "user_defined_function"
            and on_demand_feature_view_proto.spec.feature_transformation.user_defined_function.body_text
            != ""
            and on_demand_feature_view_proto.spec.mode == "pandas"
        ):
            transformation = PandasTransformation.from_proto(
                on_demand_feature_view_proto.spec.feature_transformation.user_defined_function
            )
        elif (
            on_demand_feature_view_proto.spec.feature_transformation.WhichOneof(
                "transformation"
            )
            == "user_defined_function"
            and on_demand_feature_view_proto.spec.feature_transformation.user_defined_function.body_text
            != ""
            and on_demand_feature_view_proto.spec.mode == "python"
        ):
            transformation = PythonTransformation.from_proto(
                on_demand_feature_view_proto.spec.feature_transformation.user_defined_function
            )
        elif (
            on_demand_feature_view_proto.spec.feature_transformation.WhichOneof(
                "transformation"
            )
            == "substrait_transformation"
        ):
            transformation = SubstraitTransformation.from_proto(
                on_demand_feature_view_proto.spec.feature_transformation.substrait_transformation
            )
        elif (
            hasattr(on_demand_feature_view_proto.spec, "user_defined_function")
            and on_demand_feature_view_proto.spec.feature_transformation.user_defined_function.body_text
            == ""
        ):
            backwards_compatible_udf = UserDefinedFunctionProto(
                name=on_demand_feature_view_proto.spec.user_defined_function.name,
                body=on_demand_feature_view_proto.spec.user_defined_function.body,
                body_text=on_demand_feature_view_proto.spec.user_defined_function.body_text,
            )
            transformation = PandasTransformation.from_proto(
                user_defined_function_proto=backwards_compatible_udf,
            )
        else:
            raise ValueError("At least one transformation type needs to be provided")

        if hasattr(on_demand_feature_view_proto.spec, "write_to_online_store"):
            write_to_online_store = (
                on_demand_feature_view_proto.spec.write_to_online_store
            )
        else:
            write_to_online_store = False
        if hasattr(on_demand_feature_view_proto.spec, "entities"):
            entities = list(on_demand_feature_view_proto.spec.entities)
        else:
            entities = []
        if hasattr(on_demand_feature_view_proto.spec, "entity_columns"):
            entity_columns = [
                Field.from_proto(field_proto)
                for field_proto in on_demand_feature_view_proto.spec.entity_columns
            ]
        else:
            entity_columns = []
        singleton = False
        if hasattr(on_demand_feature_view_proto.spec, "singleton"):
            singleton = on_demand_feature_view_proto.spec.singleton

        on_demand_feature_view_obj = cls(
            name=on_demand_feature_view_proto.spec.name,
            schema=[
                Field(
                    name=feature.name,
                    dtype=from_value_type(ValueType(feature.value_type)),
                    vector_index=feature.vector_index,
                    vector_length=feature.vector_length,
                    vector_search_metric=feature.vector_search_metric,
                )
                for feature in on_demand_feature_view_proto.spec.features
            ],
            sources=cast(List[OnDemandSourceType], sources),
            feature_transformation=transformation,
            mode=on_demand_feature_view_proto.spec.mode or "pandas",
            description=on_demand_feature_view_proto.spec.description,
            tags=dict(on_demand_feature_view_proto.spec.tags),
            owner=on_demand_feature_view_proto.spec.owner,
            write_to_online_store=write_to_online_store,
            singleton=singleton,
        )

        on_demand_feature_view_obj.entities = entities
        on_demand_feature_view_obj.entity_columns = entity_columns

        # FeatureViewProjections are not saved in the OnDemandFeatureView proto.
        # Create the default projection.
        on_demand_feature_view_obj.projection = FeatureViewProjection.from_definition(
            on_demand_feature_view_obj
        )

        if on_demand_feature_view_proto.meta.HasField("created_timestamp"):
            on_demand_feature_view_obj.created_timestamp = (
                on_demand_feature_view_proto.meta.created_timestamp.ToDatetime()
            )
        if on_demand_feature_view_proto.meta.HasField("last_updated_timestamp"):
            on_demand_feature_view_obj.last_updated_timestamp = (
                on_demand_feature_view_proto.meta.last_updated_timestamp.ToDatetime()
            )

        return on_demand_feature_view_obj

    def get_request_data_schema(self) -> dict[str, ValueType]:
        schema: dict[str, ValueType] = {}
        for request_source in self.source_request_sources.values():
            if isinstance(request_source.schema, list):
                new_schema = {}
                for field in request_source.schema:
                    new_schema[field.name] = field.dtype.to_value_type()
                schema.update(new_schema)
            elif isinstance(request_source.schema, dict):
                schema.update(request_source.schema)
            else:
                raise TypeError(
                    f"Request source schema is not correct type: ${str(type(request_source.schema))}"
                )
        return schema

    def _get_projected_feature_name(self, feature: str) -> str:
        return f"{self.projection.name_to_use()}__{feature}"

    def transform_ibis(
        self,
        ibis_table,
        full_feature_names: bool = False,
    ):
        from ibis.expr.types import Table

        if not isinstance(ibis_table, Table):
            raise TypeError("transform_ibis only accepts ibis.expr.types.Table")

        if not isinstance(self.feature_transformation, SubstraitTransformation):
            raise TypeError(
                "The feature_transformation is not SubstraitTransformation type while calling transform_ibis()."
            )

        columns_to_cleanup = []
        for source_fv_projection in self.source_feature_view_projections.values():
            for feature in source_fv_projection.features:
                full_feature_ref = f"{source_fv_projection.name}__{feature.name}"
                if full_feature_ref in ibis_table.columns:
                    # Make sure the partial feature name is always present
                    ibis_table = ibis_table.mutate(
                        **{feature.name: ibis_table[full_feature_ref]}
                    )
                    columns_to_cleanup.append(feature.name)
                elif feature.name in ibis_table.columns:
                    ibis_table = ibis_table.mutate(
                        **{full_feature_ref: ibis_table[feature.name]}
                    )
                    columns_to_cleanup.append(full_feature_ref)

        transformed_table = self.feature_transformation.transform_ibis(ibis_table)

        transformed_table = transformed_table.drop(*columns_to_cleanup)

        rename_columns: dict[str, str] = {}
        for feature in self.features:
            short_name = feature.name
            long_name = self._get_projected_feature_name(feature.name)
            if short_name in transformed_table.columns and full_feature_names:
                rename_columns[short_name] = long_name
            elif not full_feature_names:
                rename_columns[long_name] = short_name

        for rename_from, rename_to in rename_columns.items():
            if rename_from in transformed_table.columns:
                transformed_table = transformed_table.rename(**{rename_to: rename_from})

        return transformed_table

    def transform_arrow(
        self,
        pa_table: pyarrow.Table,
        full_feature_names: bool = False,
    ) -> pyarrow.Table:
        if not isinstance(pa_table, pyarrow.Table):
            raise TypeError("transform_arrow only accepts pyarrow.Table")
        columns_to_cleanup = []
        for source_fv_projection in self.source_feature_view_projections.values():
            for feature in source_fv_projection.features:
                full_feature_ref = f"{source_fv_projection.name}__{feature.name}"
                if full_feature_ref in pa_table.column_names:
                    # Make sure the partial feature name is always present
                    pa_table = pa_table.append_column(
                        feature.name, pa_table[full_feature_ref]
                    )
                    columns_to_cleanup.append(feature.name)
                elif feature.name in pa_table.column_names:
                    # Make sure the full feature name is always present
                    pa_table = pa_table.append_column(
                        full_feature_ref, pa_table[feature.name]
                    )
                    columns_to_cleanup.append(full_feature_ref)

        df_with_transformed_features: pyarrow.Table = (
            self.feature_transformation.transform_arrow(pa_table, self.features)
        )

        # Work out whether the correct columns names are used.
        rename_columns: dict[str, str] = {}
        for feature in self.features:
            short_name = feature.name
            long_name = self._get_projected_feature_name(feature.name)
            if (
                short_name in df_with_transformed_features.column_names
                and full_feature_names
            ):
                rename_columns[short_name] = long_name
            elif not full_feature_names:
                rename_columns[long_name] = short_name

        # Cleanup extra columns used for transformation
        for col in columns_to_cleanup:
            if col in df_with_transformed_features.column_names:
                df_with_transformed_features = df_with_transformed_features.drop(col)
        return df_with_transformed_features.rename_columns(
            [
                rename_columns.get(c, c)
                for c in df_with_transformed_features.column_names
            ]
        )

    def transform_dict(
        self,
        feature_dict: dict[str, Any],  # type: ignore
    ) -> dict[str, Any]:
        # we need a mapping from full feature name to short and back to do a renaming
        # The simplest thing to do is to make the full reference, copy the columns with the short reference
        # and rerun
        columns_to_cleanup: list[str] = []
        for source_fv_projection in self.source_feature_view_projections.values():
            for feature in source_fv_projection.features:
                full_feature_ref = f"{source_fv_projection.name}__{feature.name}"
                if full_feature_ref in feature_dict.keys():
                    # Make sure the partial feature name is always present
                    feature_dict[feature.name] = feature_dict[full_feature_ref]
                    columns_to_cleanup.append(str(feature.name))
                elif feature.name in feature_dict.keys():
                    # Make sure the full feature name is always present
                    feature_dict[full_feature_ref] = feature_dict[feature.name]
                    columns_to_cleanup.append(str(full_feature_ref))

        if self.singleton and self.mode == "python":
            output_dict: dict[str, Any] = (
                self.feature_transformation.transform_singleton(feature_dict)
            )
        else:
            output_dict = self.feature_transformation.transform(feature_dict)
        for feature_name in columns_to_cleanup:
            del output_dict[feature_name]
        return output_dict

    def infer_features(self) -> None:
        random_input = self._construct_random_input(singleton=self.singleton)
        inferred_features = self.feature_transformation.infer_features(
            random_input=random_input, singleton=self.singleton
        )

        if self.features:
            missing_features = []
            for specified_feature in self.features:
                if (
                    specified_feature not in inferred_features
                    and "Array" not in specified_feature.dtype.__str__()
                ):
                    missing_features.append(specified_feature)
                elif "Array" in specified_feature.dtype.__str__():
                    if specified_feature.name not in [
                        f.name for f in inferred_features
                    ]:
                        missing_features.append(specified_feature)
                else:
                    pass
            if missing_features:
                raise SpecifiedFeaturesNotPresentError(
                    missing_features, inferred_features, self.name
                )
        else:
            self.features = inferred_features

        if not self.features:
            raise RegistryInferenceFailure(
                "OnDemandFeatureView",
                f"Could not infer Features for the feature view '{self.name}'.",
            )

    def _construct_random_input(
        self, singleton: bool = False
    ) -> dict[str, Union[list[Any], Any]]:
        rand_dict_value: dict[ValueType, Union[list[Any], Any]] = {
            ValueType.BYTES: [str.encode("hello world")],
            ValueType.PDF_BYTES: [
                b"%PDF-1.3\n3 0 obj\n<</Type /Page\n/Parent 1 0 R\n/Resources 2 0 R\n/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Filter /FlateDecode /Length 115>>\nstream\nx\x9c\x15\xcc1\x0e\x820\x18@\xe1\x9dS\xbcM]jk$\xd5\xd5(\x83!\x86\xa1\x17\xf8\xa3\xa5`LIh+\xd7W\xc6\xf7\r\xef\xc0\xbd\xd2\xaa\xb6,\xd5\xc5\xb1o\x0c\xa6VZ\xe3znn%\xf3o\xab\xb1\xe7\xa3:Y\xdc\x8bm\xeb\xf3&1\xc8\xd7\xd3\x97\xc82\xe6\x81\x87\xe42\xcb\x87Vb(\x12<\xdd<=}Jc\x0cL\x91\xee\xda$\xb5\xc3\xbd\xd7\xe9\x0f\x8d\x97 $\nendstream\nendobj\n1 0 obj\n<</Type /Pages\n/Kids [3 0 R ]\n/Count 1\n/MediaBox [0 0 595.28 841.89]\n>>\nendobj\n5 0 obj\n<</Type /Font\n/BaseFont /Helvetica\n/Subtype /Type1\n/Encoding /WinAnsiEncoding\n>>\nendobj\n2 0 obj\n<<\n/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]\n/Font <<\n/F1 5 0 R\n>>\n/XObject <<\n>>\n>>\nendobj\n6 0 obj\n<<\n/Producer (PyFPDF 1.7.2 http://pyfpdf.googlecode.com/)\n/Title (This is a sample title.)\n/Author (Francisco Javier Arceo)\n/CreationDate (D:20250312165548)\n>>\nendobj\n7 0 obj\n<<\n/Type /Catalog\n/Pages 1 0 R\n/OpenAction [3 0 R /FitH null]\n/PageLayout /OneColumn\n>>\nendobj\nxref\n0 8\n0000000000 65535 f \n0000000272 00000 n \n0000000455 00000 n \n0000000009 00000 n \n0000000087 00000 n \n0000000359 00000 n \n0000000559 00000 n \n0000000734 00000 n \ntrailer\n<<\n/Size 8\n/Root 7 0 R\n/Info 6 0 R\n>>\nstartxref\n837\n%%EOF\n"
            ],
            ValueType.STRING: ["hello world"],
            ValueType.INT32: [1],
            ValueType.INT64: [1],
            ValueType.DOUBLE: [1.0],
            ValueType.FLOAT: [1.0],
            ValueType.BOOL: [True],
            ValueType.UNIX_TIMESTAMP: [_utc_now()],
            ValueType.BYTES_LIST: [[str.encode("hello world")]],
            ValueType.STRING_LIST: [["hello world"]],
            ValueType.INT32_LIST: [[1]],
            ValueType.INT64_LIST: [[1]],
            ValueType.DOUBLE_LIST: [[1.0]],
            ValueType.FLOAT_LIST: [[1.0]],
            ValueType.BOOL_LIST: [[True]],
            ValueType.UNIX_TIMESTAMP_LIST: [[_utc_now()]],
        }
        if singleton:
            rand_dict_value = {k: rand_dict_value[k][0] for k in rand_dict_value}

        rand_missing_value = [None] if singleton else None
        feature_dict = {}
        for feature_view_projection in self.source_feature_view_projections.values():
            for feature in feature_view_projection.features:
                feature_dict[f"{feature_view_projection.name}__{feature.name}"] = (
                    rand_dict_value.get(
                        feature.dtype.to_value_type(), rand_missing_value
                    )
                )
                feature_dict[f"{feature.name}"] = rand_dict_value.get(
                    feature.dtype.to_value_type(), rand_missing_value
                )
        for request_data in self.source_request_sources.values():
            for field in request_data.schema:
                feature_dict[f"{field.name}"] = rand_dict_value.get(
                    field.dtype.to_value_type(), rand_missing_value
                )

        return feature_dict

    @staticmethod
    def get_requested_odfvs(
        feature_refs, project, registry
    ) -> list["OnDemandFeatureView"]:
        all_on_demand_feature_views = registry.list_on_demand_feature_views(
            project, allow_cache=True
        )
        requested_on_demand_feature_views: list[OnDemandFeatureView] = []
        for odfv in all_on_demand_feature_views:
            for feature in odfv.features:
                if f"{odfv.name}:{feature.name}" in feature_refs:
                    requested_on_demand_feature_views.append(odfv)
                    break
        return requested_on_demand_feature_views


def on_demand_feature_view(
    *,
    name: Optional[str] = None,
    entities: Optional[List[Entity]] = None,
    schema: list[Field],
    sources: list[
        Union[
            FeatureView,
            RequestSource,
            FeatureViewProjection,
        ]
    ],
    mode: str = "pandas",
    description: str = "",
    tags: Optional[dict[str, str]] = None,
    owner: str = "",
    write_to_online_store: bool = False,
    singleton: bool = False,
    explode: bool = False,
):
    """
    Creates an OnDemandFeatureView object with the given user function as udf.

    Args:
        name (optional): The name of the on demand feature view. If not provided, the name will be the name of the user function.
        entities (Optional): The list of names of entities that this feature view is associated with.
        schema: The list of features in the output of the on demand feature view, after
            the transformation has been applied.
        sources: A map from input source names to the actual input sources, which may be
            feature views, or request data sources. These sources serve as inputs to the udf,
            which will refer to them by name.
        mode: The mode of execution (e.g,. Pandas or Python Native)
        description (optional): A human-readable description.
        tags (optional): A dictionary of key-value pairs to store arbitrary metadata.
        owner (optional): The owner of the on demand feature view, typically the email
            of the primary maintainer.
        write_to_online_store (optional): A boolean that indicates whether to write the on demand feature view to
            the online store for faster retrieval.
        singleton (optional): A boolean that indicates whether the transformation is executed on a singleton
            (only applicable when mode="python").
        explode (optional): A boolean that indicates whether the transformation explodes the input data into multiple rows.
    """

    def mainify(obj) -> None:
        # Needed to allow dill to properly serialize the udf. Otherwise, clients will need to have a file with the same
        # name as the original file defining the ODFV.
        if obj.__module__ != "__main__":
            obj.__module__ = "__main__"

    def decorator(user_function):
        udf_string = dill.source.getsource(user_function)
        mainify(user_function)

        on_demand_feature_view_obj = OnDemandFeatureView(
            name=name if name is not None else user_function.__name__,
            sources=sources,
            schema=schema,
            mode=mode,
            description=description,
            tags=tags,
            owner=owner,
            write_to_online_store=write_to_online_store,
            entities=entities,
            singleton=singleton,
            udf=user_function,
            udf_string=udf_string,
        )
        functools.update_wrapper(
            wrapper=on_demand_feature_view_obj, wrapped=user_function
        )
        return on_demand_feature_view_obj

    return decorator


def _empty_odfv_udf_fn(x: Any) -> Any:
    # just an identity mapping, otherwise we risk tripping some downstream tests
    return x
