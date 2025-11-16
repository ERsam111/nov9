import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileUp } from 'lucide-react';

export const InputNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`px-3 py-2 shadow-md rounded-md bg-card border-2 ${selected ? 'border-primary' : 'border-border'} min-w-[140px] hover:shadow-lg transition-all group`}>
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
          <FileUp className="h-3 w-3 text-blue-500" />
        </div>
        <div className="font-semibold text-xs">Input</div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {(data as any).fileName || 'No file'}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

InputNode.displayName = 'InputNode';
