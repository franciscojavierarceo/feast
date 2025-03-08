import React from "react";
import { Handle, Position } from "reactflow";
import { EuiPanel, EuiText, EuiTitle, EuiSpacer, EuiBadge } from "@elastic/eui";
import { FEAST_FCO_TYPES } from "../../parsers/types";

interface NodeData {
  label: string;
  type: FEAST_FCO_TYPES;
  color: string;
  metadata: any;
}

// Base node component for potential future reuse
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BaseNode = ({ data }: { data: NodeData }) => {
  return (
    <EuiPanel
      hasShadow
      style={{
        borderTop: `3px solid ${data.color}`,
        padding: "10px",
        minWidth: "150px",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <EuiTitle size="xs">
        <h5>{data.label}</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiBadge color={data.color}>{data.type}</EuiBadge>
      <Handle type="source" position={Position.Right} />
    </EuiPanel>
  );
};

export const DataSourceNode = ({ data }: { data: NodeData }) => {
  return (
    <EuiPanel
      hasShadow
      style={{
        borderTop: `3px solid ${data.color}`,
        padding: "10px",
        minWidth: "150px",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <EuiTitle size="xs">
        <h5>{data.label}</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiBadge color={data.color}>Data Source</EuiBadge>
      {data.metadata?.type && (
        <EuiText size="xs">Type: {data.metadata.type}</EuiText>
      )}
      <Handle type="source" position={Position.Right} />
    </EuiPanel>
  );
};

export const EntityNode = ({ data }: { data: NodeData }) => {
  return (
    <EuiPanel
      hasShadow
      style={{
        borderTop: `3px solid ${data.color}`,
        padding: "10px",
        minWidth: "150px",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <EuiTitle size="xs">
        <h5>{data.label}</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiBadge color={data.color}>Entity</EuiBadge>
      {data.metadata?.joinKeys && data.metadata.joinKeys.length > 0 && (
        <EuiText size="xs">Join Keys: {data.metadata.joinKeys.join(", ")}</EuiText>
      )}
      <Handle type="source" position={Position.Right} />
    </EuiPanel>
  );
};

export const FeatureViewNode = ({ data }: { data: NodeData }) => {
  return (
    <EuiPanel
      hasShadow
      style={{
        borderTop: `3px solid ${data.color}`,
        padding: "10px",
        minWidth: "150px",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <EuiTitle size="xs">
        <h5>{data.label}</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiBadge color={data.color}>Feature View</EuiBadge>
      {data.metadata?.features && data.metadata.features.length > 0 && (
        <EuiText size="xs">
          Features: {data.metadata.features.length > 3 
            ? `${data.metadata.features.slice(0, 3).join(", ")}...` 
            : data.metadata.features.join(", ")}
        </EuiText>
      )}
      <Handle type="source" position={Position.Right} />
    </EuiPanel>
  );
};

export const FeatureServiceNode = ({ data }: { data: NodeData }) => {
  return (
    <EuiPanel
      hasShadow
      style={{
        borderTop: `3px solid ${data.color}`,
        padding: "10px",
        minWidth: "150px",
      }}
    >
      <Handle type="target" position={Position.Left} />
      <EuiTitle size="xs">
        <h5>{data.label}</h5>
      </EuiTitle>
      <EuiSpacer size="xs" />
      <EuiBadge color={data.color}>Feature Service</EuiBadge>
      {data.metadata?.features && (
        <EuiText size="xs">Features: {data.metadata.features}</EuiText>
      )}
      <Handle type="source" position={Position.Right} />
    </EuiPanel>
  );
};

export const nodeTypes = {
  dataSourceNode: DataSourceNode,
  entityNode: EntityNode,
  featureViewNode: FeatureViewNode,
  featureServiceNode: FeatureServiceNode,
};
