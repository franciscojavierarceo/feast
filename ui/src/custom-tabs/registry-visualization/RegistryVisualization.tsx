import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
// Import CSS conditionally to avoid Jest test failures
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  require("reactflow/dist/style.css");
}
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiLoadingSpinner,
  EuiButtonGroup,
  EuiEmptyPrompt,
} from "@elastic/eui";
import useRegistryVisualization from "./useRegistryVisualization";
import { nodeTypes } from "./CustomNodes";

const RegistryVisualizationInner = () => {
  const { isLoading, isError, getNodesAndEdges } = useRegistryVisualization();
  const [selectedLayout, setSelectedLayout] = useState("LR");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setNodes, setEdges, fitView } = useReactFlow();
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  
  useEffect(() => {
    if (!isLoading && !isError) {
      const data = getNodesAndEdges();
      // Use JSON.stringify to prevent infinite updates
      const dataString = JSON.stringify(data);
      const currentDataString = JSON.stringify(graphData);
      
      if (dataString !== currentDataString) {
        setGraphData(data);
      }
    }
  }, [isLoading, isError, getNodesAndEdges, graphData]);

  const onLayoutChange = useCallback(
    (optionId: string) => {
      setSelectedLayout(optionId);
      // Update layout direction in the future
      fitView();
    },
    [fitView]
  );

  const layoutOptions = [
    {
      id: "LR",
      label: "Left to Right",
    },
    {
      id: "TB",
      label: "Top to Bottom",
    },
  ];

  if (isLoading) {
    return (
      <EuiPanel>
        <EuiFlexGroup alignItems="center" justifyContent="center" style={{ height: "200px" }}>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="l" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText>Loading registry data...</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  if (isError) {
    return (
      <EuiPanel>
        <EuiTitle size="s">
          <h3>Error Loading Registry Data</h3>
        </EuiTitle>
        <EuiSpacer />
        <EuiText>
          There was an error loading the registry data. Please check that the
          registry file is available and properly formatted.
        </EuiText>
      </EuiPanel>
    );
  }
  
  if (graphData.nodes.length === 0) {
    return (
      <EuiPanel>
        <EuiEmptyPrompt
          iconType="visualizeApp"
          title={<h3>No Registry Data Available</h3>}
          body={
            <p>
              No relationships found in the registry. This could be because the registry is empty
              or the relationships couldn't be parsed correctly.
            </p>
          }
        />
      </EuiPanel>
    );
  }

  return (
    <EuiPanel style={{ height: "80vh" }}>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiTitle size="s">
            <h3>Feast Registry Visualization</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend="Layout Direction"
            options={layoutOptions}
            idSelected={selectedLayout}
            onChange={onLayoutChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <div style={{ height: "70vh" }}>
        <ReactFlow
          nodes={graphData.nodes}
          edges={graphData.edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          attributionPosition="bottom-right"
        >
          <Controls />
          <MiniMap />
          <Background />
          <Panel position="top-right">
            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  onClick={() => {
                    fitView();
                  }}
                >
                  Fit View
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </Panel>
        </ReactFlow>
      </div>
    </EuiPanel>
  );
};

const RegistryVisualization = () => {
  return (
    <ReactFlowProvider>
      <RegistryVisualizationInner />
    </ReactFlowProvider>
  );
};

export default RegistryVisualization;
