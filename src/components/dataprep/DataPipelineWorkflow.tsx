import { useState } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { ToolPalette } from './ToolPalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { DataPreviewPanel } from './DataPreviewPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface DataPipelineWorkflowProps {
  project: any;
}

export const DataPipelineWorkflow = ({ project }: DataPipelineWorkflowProps) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  const handleDataPreview = (nodeId: string, data: any[]) => {
    setPreviewData(data);
    setPreviewNodeId(nodeId);
  };

  const handleUpdateNode = (nodeId: string, data: any) => {
    // TODO: Implement node update logic
    console.log('Update node:', nodeId, data);
  };

  const handleRunNode = (nodeId: string) => {
    // TODO: Implement node execution logic  
    console.log('Run node:', nodeId);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Panel - Tool Palette */}
      <ResizablePanel defaultSize={15} minSize={12} maxSize={20}>
        <ToolPalette />
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Middle Panel - Workflow Canvas */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={70}>
            <WorkflowCanvas 
              onNodeSelect={handleNodeSelect}
              onDataPreview={handleDataPreview}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          <ResizablePanel defaultSize={30}>
            <DataPreviewPanel data={previewData} nodeId={previewNodeId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      
      <ResizableHandle />
      
      {/* Right Panel - Node Configuration */}
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
        <NodeConfigPanel 
          selectedNode={selectedNode} 
          onUpdateNode={handleUpdateNode}
          onRunNode={handleRunNode}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
