import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import RegistryVisualization from "./RegistryVisualization";

// Mock ReactFlow since it's not compatible with Jest environment
jest.mock("reactflow", () => {
  const mockReactFlow = () => <div data-testid="mock-react-flow">ReactFlow Mock</div>;
  const mockControls = () => <div>Controls Mock</div>;
  const mockBackground = () => <div>Background Mock</div>;
  const mockMiniMap = () => <div>MiniMap Mock</div>;
  const mockPanel = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const mockReactFlowProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const mockUseReactFlow = () => ({
    fitView: jest.fn(),
    setNodes: jest.fn(),
    setEdges: jest.fn(),
  });

  return {
    __esModule: true,
    ReactFlow: mockReactFlow,
    Controls: mockControls,
    Background: mockBackground,
    MiniMap: mockMiniMap,
    Panel: mockPanel,
    useReactFlow: mockUseReactFlow,
    ReactFlowProvider: mockReactFlowProvider,
    default: {
      ReactFlow: mockReactFlow,
      Controls: mockControls,
      Background: mockBackground,
      MiniMap: mockMiniMap,
      Panel: mockPanel,
      useReactFlow: mockUseReactFlow,
      ReactFlowProvider: mockReactFlowProvider,
    }
  };
});

// Mock the custom hook
jest.mock("./useRegistryVisualization", () => ({
  __esModule: true,
  default: () => ({
    isLoading: false,
    isError: false,
    getNodesAndEdges: () => ({ nodes: [], edges: [] }),
  }),
}));

// Mock the node types
jest.mock("./CustomNodes", () => ({
  __esModule: true,
  nodeTypes: {
    dataSourceNode: () => <div>Data Source Node</div>,
    entityNode: () => <div>Entity Node</div>,
    featureViewNode: () => <div>Feature View Node</div>,
    featureServiceNode: () => <div>Feature Service Node</div>,
  },
}));

const queryClient = new QueryClient();

describe("RegistryVisualization", () => {
  it("renders without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RegistryVisualization />
      </QueryClientProvider>
    );
    
    // Since we're showing empty state when no nodes are found
    expect(screen.getByText(/No Registry Data Available/i)).toBeInTheDocument();
  });
});
