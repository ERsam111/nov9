import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Wand2 } from 'lucide-react';

export const TransformNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 ${selected ? 'border-primary' : 'border-border'} min-w-[200px]`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-green-500/10">
          <Wand2 className="h-4 w-4 text-green-500" />
        </div>
        <div className="font-semibold text-sm">Transform</div>
      </div>
      <div className="text-xs text-muted-foreground">
        {(data as any).config?.transformation || 'No transformation'}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

TransformNode.displayName = 'TransformNode';
