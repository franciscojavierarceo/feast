# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: feast/core/Aggregation.proto
# Protobuf Python Version: 5.29.0
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    29,
    0,
    '',
    'feast/core/Aggregation.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from google.protobuf import duration_pb2 as google_dot_protobuf_dot_duration__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1c\x66\x65\x61st/core/Aggregation.proto\x12\nfeast.core\x1a\x1egoogle/protobuf/duration.proto\"\x92\x01\n\x0b\x41ggregation\x12\x0e\n\x06\x63olumn\x18\x01 \x01(\t\x12\x10\n\x08\x66unction\x18\x02 \x01(\t\x12.\n\x0btime_window\x18\x03 \x01(\x0b\x32\x19.google.protobuf.Duration\x12\x31\n\x0eslide_interval\x18\x04 \x01(\x0b\x32\x19.google.protobuf.DurationBU\n\x10\x66\x65\x61st.proto.coreB\x10\x41ggregationProtoZ/github.com/feast-dev/feast/go/protos/feast/coreb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'feast.core.Aggregation_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'\n\020feast.proto.coreB\020AggregationProtoZ/github.com/feast-dev/feast/go/protos/feast/core'
  _globals['_AGGREGATION']._serialized_start=77
  _globals['_AGGREGATION']._serialized_end=223
# @@protoc_insertion_point(module_scope)
