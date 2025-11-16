import { useCallback, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { InputNode } from './nodes/InputNode';
import { FilterNode } from './nodes/FilterNode';
import { JoinNode } from './nodes/JoinNode';
import { TransformNode } from './nodes/TransformNode';
import { OutputNode } from './nodes/OutputNode';
import { AggregateNode } from './nodes/AggregateNode';
import { SortNode } from './nodes/SortNode';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const nodeTypes: NodeTypes = {
  input: InputNode,
  filter: FilterNode,
  join: JoinNode,
  transform: TransformNode,
  output: OutputNode,
  aggregate: AggregateNode,
  sort: SortNode,
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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { 
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {}
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeSelect(node);
    setSelectedNodes([node.id]);
  }, [onNodeSelect]);

  const onSelectionChange = useCallback((params: any) => {
    setSelectedNodes(params.nodes.map((n: Node) => n.id));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
    setSelectedNodes([]);
    onNodeSelect(null);
  }, [selectedNodes, setNodes, setEdges, onNodeSelect]);

  return (
    <Card className="h-full border-2 relative">
      {selectedNodes.length > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={handleDeleteSelected}
            size="sm"
            variant="destructive"
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedNodes.length})
          </Button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/30"
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={() => 'hsl(var(--primary))'} />
      </ReactFlow>
    </Card>
  );
};
