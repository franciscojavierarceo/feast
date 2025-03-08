import { useCallback, useContext } from "react";
import { Node, Edge, Position } from "reactflow";
import dagre from "dagre";
import useLoadRelationshipData from "../../queries/useLoadRelationshipsData";
import useLoadRegistry from "../../queries/useLoadRegistry";
import { FEAST_FCO_TYPES } from "../../parsers/types";
import RegistryPathContext from "../../contexts/RegistryPathContext";

// Node types based on Feast object types
const NODE_TYPES = {
  [FEAST_FCO_TYPES.dataSource]: "dataSourceNode",
  [FEAST_FCO_TYPES.entity]: "entityNode",
  [FEAST_FCO_TYPES.featureView]: "featureViewNode",
  [FEAST_FCO_TYPES.featureService]: "featureServiceNode",
};

// Node colors based on Feast object types
const NODE_COLORS = {
  [FEAST_FCO_TYPES.dataSource]: "#009688",
  [FEAST_FCO_TYPES.entity]: "#2196F3",
  [FEAST_FCO_TYPES.featureView]: "#FF9800",
  [FEAST_FCO_TYPES.featureService]: "#E91E63",
};

// Function to get node dimensions based on type
const getNodeDimensions = (type: FEAST_FCO_TYPES) => {
  switch (type) {
    case FEAST_FCO_TYPES.dataSource:
      return { width: 180, height: 60 };
    case FEAST_FCO_TYPES.entity:
      return { width: 150, height: 50 };
    case FEAST_FCO_TYPES.featureView:
      return { width: 200, height: 70 };
    case FEAST_FCO_TYPES.featureService:
      return { width: 220, height: 80 };
    default:
      return { width: 180, height: 60 };
  }
};

// Function to layout nodes using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    const dimensions = getNodeDimensions(node.data.type);
    dagreGraph.setNode(node.id, dimensions);
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const useRegistryVisualization = () => {
  const registryUrl = useContext(RegistryPathContext);
  const relationshipQuery = useLoadRelationshipData();
  const registryQuery = useLoadRegistry(registryUrl);

  const getNodesAndEdges = useCallback(() => {
    if (!relationshipQuery.isSuccess || !registryQuery.isSuccess) {
      return { nodes: [], edges: [] };
    }

    const relationships = relationshipQuery.data || [];
    const registry = registryQuery.data;

    if (!registry || !registry.objects) {
      return { nodes: [], edges: [] };
    }

    // Create a map to track unique nodes
    const nodesMap = new Map<string, Node>();

    // Process relationships to create nodes and edges
    relationships.forEach((relation) => {
      // Create source node if it doesn't exist
      const sourceId = `${relation.source.type}-${relation.source.name}`;
      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          id: sourceId,
          type: NODE_TYPES[relation.source.type],
          data: {
            label: relation.source.name,
            type: relation.source.type,
            color: NODE_COLORS[relation.source.type],
            // Add metadata based on object type
            metadata: getMetadataForObject(relation.source.type, relation.source.name, registry.objects),
          },
          position: { x: 0, y: 0 }, // Will be calculated by dagre
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      // Create target node if it doesn't exist
      const targetId = `${relation.target.type}-${relation.target.name}`;
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          id: targetId,
          type: NODE_TYPES[relation.target.type],
          data: {
            label: relation.target.name,
            type: relation.target.type,
            color: NODE_COLORS[relation.target.type],
            // Add metadata based on object type
            metadata: getMetadataForObject(relation.target.type, relation.target.name, registry.objects),
          },
          position: { x: 0, y: 0 }, // Will be calculated by dagre
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }
    });

    // Create edges from relationships
    const edges = relationships.map((relation, index) => ({
      id: `edge-${index}`,
      source: `${relation.source.type}-${relation.source.name}`,
      target: `${relation.target.type}-${relation.target.name}`,
      animated: true,
      style: { stroke: '#999' },
      label: relation.type,
    }));

    // Convert nodes map to array
    const nodes = Array.from(nodesMap.values());

    // If no relationships found, create placeholder nodes for each object type
    if (nodes.length === 0) {
      // Add placeholder nodes for each object type
      Object.values(registry.objects).forEach((objectList: any) => {
        if (Array.isArray(objectList)) {
          objectList.slice(0, 5).forEach((obj: any) => {
            const name = obj.spec?.name;
            const type = getObjectType(obj);
            if (name && type && NODE_TYPES[type]) {
              const id = `${type}-${name}`;
              nodesMap.set(id, {
                id,
                type: NODE_TYPES[type],
                data: {
                  label: name,
                  type,
                  color: NODE_COLORS[type],
                  metadata: getMetadataForObject(type, name, registry.objects),
                },
                position: { x: 0, y: 0 },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
              });
            }
          });
        }
      });
    }

    // Apply layout with all nodes
    return getLayoutedElements(Array.from(nodesMap.values()), edges);
  }, [relationshipQuery.data, relationshipQuery.isSuccess, registryQuery.data, registryQuery.isSuccess]);

  // Helper function to determine object type
  const getObjectType = (obj: any): FEAST_FCO_TYPES | null => {
    if (obj.meta?.className === "FeatureView") return FEAST_FCO_TYPES.featureView;
    if (obj.meta?.className === "Entity") return FEAST_FCO_TYPES.entity;
    if (obj.meta?.className === "FeatureService") return FEAST_FCO_TYPES.featureService;
    if (obj.meta?.className === "DataSource") return FEAST_FCO_TYPES.dataSource;
    return null;
  };

  // Helper function to extract metadata based on object type
  const getMetadataForObject = (type: FEAST_FCO_TYPES, name: string, registry: any) => {
    switch (type) {
      case FEAST_FCO_TYPES.dataSource:
        const dataSource = registry.dataSources?.find((ds: any) => ds.spec?.name === name);
        return {
          type: dataSource?.spec?.type || "Unknown",
          description: dataSource?.spec?.description || "",
        };
      case FEAST_FCO_TYPES.entity:
        const entity = registry.entities?.find((e: any) => e.spec?.name === name);
        return {
          description: entity?.spec?.description || "",
          joinKeys: entity?.spec?.joinKeys || [],
        };
      case FEAST_FCO_TYPES.featureView:
        const featureView = registry.featureViews?.find((fv: any) => fv.spec?.name === name);
        return {
          description: featureView?.spec?.description || "",
          features: featureView?.spec?.features?.map((f: any) => f.name) || [],
        };
      case FEAST_FCO_TYPES.featureService:
        const featureService = registry.featureServices?.find((fs: any) => fs.spec?.name === name);
        return {
          description: featureService?.spec?.description || "",
          features: featureService?.spec?.features?.length || 0,
        };
      default:
        return {};
    }
  };

  return {
    ...relationshipQuery,
    getNodesAndEdges,
  };
};

export default useRegistryVisualization;
