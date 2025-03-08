import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import RegistryVisualization from "./RegistryVisualization";

// Mock ReactFlow since it's not compatible with Jest environment
jest.mock("reactflow", () => ({
  ReactFlow: () => <div data-testid="mock-react-flow">ReactFlow Mock</div>,
  Controls: () => <div>Controls Mock</div>,
  Background: () => <div>Background Mock</div>,
  MiniMap: () => <div>MiniMap Mock</div>,
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useReactFlow: () => ({
    fitView: jest.fn(),
    setNodes: jest.fn(),
    setEdges: jest.fn(),
  }),
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the custom hook
jest.mock("./useRegistryVisualization", () => ({
  __esModule: true,
  default: () => ({
    isLoading: false,
    isError: false,
    getNodesAndEdges: () => ({ nodes: [], edges: [] }),
  }),
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
