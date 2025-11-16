import { useState } from 'react';
import { Node } from '@xyflow/react';
import { ToolPalette } from './ToolPalette';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { DataPreviewPanel } from './DataPreviewPanel';

interface DataPrepWorkflowProps {
  project: any;
}

export const DataPrepWorkflow = ({ project }: DataPrepWorkflowProps) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);

  const handleNodeSelect = (node: Node | null) => {
    setSelectedNode(node);
  };

  const handleUpdateNode = (nodeId: string, data: any) => {
    // Update node data in the workflow
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data } as Node : prev));
  };

  const handleRunNode = (nodeId: string) => {
    // Mock execution - in production, this would execute the actual data transformation
    const mockData = Array.from({ length: 50 }, (_, i) => ({
      CustomerID: `C${1000 + i}`,
      ProductID: `P${100 + (i % 20)}`,
      Demand: Math.floor(Math.random() * 1000),
      Location: ['New York', 'Los Angeles', 'Chicago', 'Houston'][i % 4],
      Price: (Math.random() * 100).toFixed(2),
    }));
    setPreviewData(mockData);
    setPreviewNodeId(nodeId);
  };

  const handleDataPreview = (nodeId: string, data: any[]) => {
    setPreviewData(data);
    setPreviewNodeId(nodeId);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4 p-4">
      {/* Top section: Tool Palette, Canvas, Config Panel */}
      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Left: Tool Palette */}
        <div className="col-span-2">
          <ToolPalette />
        </div>

        {/* Center: Workflow Canvas */}
        <div className="col-span-7">
          <WorkflowCanvas onNodeSelect={handleNodeSelect} onDataPreview={handleDataPreview} />
        </div>

        {/* Right: Node Configuration */}
        <div className="col-span-3">
          <NodeConfigPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onRunNode={handleRunNode}
          />
        </div>
      </div>

      {/* Bottom section: Data Preview */}
      <div className="h-[40vh]">
        <DataPreviewPanel data={previewData} nodeId={previewNodeId} />
      </div>
    </div>
  );
};
