// Mock for ReactFlow
module.exports = {
  ReactFlow: jest.fn(() => null),
  Controls: jest.fn(() => null),
  Background: jest.fn(() => null),
  MiniMap: jest.fn(() => null),
  Panel: jest.fn(({ children }) => children),
  useReactFlow: jest.fn(() => ({
    fitView: jest.fn(),
    setNodes: jest.fn(),
    setEdges: jest.fn(),
  })),
  ReactFlowProvider: jest.fn(({ children }) => children),
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
};
