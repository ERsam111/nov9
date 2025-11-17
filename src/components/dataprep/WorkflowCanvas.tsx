import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { InputNode } from "./nodes/InputNode";
import { FilterNode } from "./nodes/FilterNode";
import { JoinNode } from "./nodes/JoinNode";
import { TransformNode } from "./nodes/TransformNode";
import { OutputNode } from "./nodes/OutputNode";
import { AggregateNode } from "./nodes/AggregateNode";
import { SortNode } from "./nodes/SortNode";
import { SelectNode } from "./nodes/SelectNode";
import { MLClassificationNode } from "./nodes/MLClassificationNode";
import { MLRegressionNode } from "./nodes/MLRegressionNode";
import { MLClusteringNode } from "./nodes/MLClusteringNode";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// ⭐ ALL NODE TYPES
const nodeTypes: NodeTypes = {
  input: InputNode,
  filter: FilterNode,
  join: JoinNode,
  transform: TransformNode,
  output: OutputNode,
  aggregate: AggregateNode,
  sort: SortNode,
  select: SelectNode,
  ml_classification: MLClassificationNode,
  ml_regression: MLRegressionNode,
  ml_clustering: MLClusteringNode,
};

interface WorkflowCanvasProps {
  onNodeSelect: (node: Node | null) => void;
  onDataPreview: (nodeId: string, data: any[]) => void;
}

export const WorkflowCanvas = ({ onNodeSelect, onDataPreview }: WorkflowCanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // 🔥 CORE: Propagate dataset to downstream nodes
  const updateDownstreamNodes = useCallback(
    (sourceId: string, dataset: any) => {
      console.log("📢 Propagating dataset from:", sourceId, dataset);

      setNodes((nds) =>
        nds.map((node) => {
          const isDownstream = edges.some((e) => e.source === sourceId && e.target === node.id);

          if (isDownstream) {
            console.log(" → Updating node", node.id);
            return {
              ...node,
              data: {
                ...node.data,
                dataset, // 🔥 Key fix
              },
            };
          }
          return node;
        }),
      );
    },
    [edges],
  );

  // 🔥 Always attach correct runtime callbacks
  const attachRuntimeCallbacks = useCallback(
    (node: Node): Node => {
      const data = { ...(node.data || {}) };

      // Input Node → emits parsed dataset
      if (node.type === "input") {
        data.onDatasetChange = (nodeId: string, dataset: any) => {
          console.log("📥 InputNode emitted dataset:", dataset);
          updateDownstreamNodes(nodeId, dataset);
          onDataPreview(nodeId, dataset.rows ?? []);
        };
      }

      // Filter → output dataset
      if (node.type === "filter") {
        data.onFilterChange = (nodeId: string, payload: any) => {
          console.log("🔎 Filter output:", payload.output);
          updateDownstreamNodes(nodeId, payload.output);
          onDataPreview(nodeId, payload.output.rows ?? []);
        };
      }

      // Select / Sort / Aggregate / Transform
      if (["select", "sort", "aggregate", "transform"].includes(node.type)) {
        data.onProcess = (nodeId: string, output: any) => {
          console.log(`⚙️ ${node.type} output:`, output);
          updateDownstreamNodes(nodeId, output);
          onDataPreview(nodeId, output.rows ?? []);
        };
      }

      return { ...node, data };
    },
    [updateDownstreamNodes, onDataPreview],
  );

  // 🔥 Always attach callbacks when nodes change
  const handleNodesChange = (changes: any) => {
    onNodesChange(changes);
    setNodes((nds) => nds.map((n) => attachRuntimeCallbacks(n)));
  };

  // Normal edge connect
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), []);

  // Drag/drop node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create node with attached callbacks
      const newNode: Node = attachRuntimeCallbacks({
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type} node`, config: {} },
      });

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, attachRuntimeCallbacks],
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeSelect(node);
      setSelectedNodes([node.id]);
    },
    [onNodeSelect],
  );

  const onSelectionChange = useCallback((params: any) => {
    setSelectedNodes(params.nodes.map((n: Node) => n.id));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
    setSelectedNodes([]);
    onNodeSelect(null);
  }, [selectedNodes]);

  return (
    <Card className="h-full border-2 relative">
      {selectedNodes.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <Button onClick={handleDeleteSelected} size="sm" variant="destructive" className="shadow-lg">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedNodes.length})
          </Button>
        </div>
      )}

      <ReactFlow
        nodes={nodes.map(attachRuntimeCallbacks)}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/30"
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={() => "hsl(var(--primary))"} />
      </ReactFlow>
    </Card>
  );
};
