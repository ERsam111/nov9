import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileUp } from 'lucide-react';

export const InputNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 ${selected ? 'border-primary' : 'border-border'} min-w-[200px]`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-blue-500/10">
          <FileUp className="h-4 w-4 text-blue-500" />
        </div>
        <div className="font-semibold text-sm">Input Data</div>
      </div>
      <div className="text-xs text-muted-foreground">
        {(data as any).fileName || 'No file selected'}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

InputNode.displayName = 'InputNode';
