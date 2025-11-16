import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Merge } from 'lucide-react';

export const JoinNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg bg-card border-2 ${selected ? 'border-primary' : 'border-border'} min-w-[200px]`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-purple-500/10">
          <Merge className="h-4 w-4 text-purple-500" />
        </div>
        <div className="font-semibold text-sm">Join</div>
      </div>
      <div className="text-xs text-muted-foreground">
        {(data as any).config?.joinType || 'Inner join'}
      </div>
      <Handle type="target" position={Position.Left} id="left" className="w-3 h-3 top-[30%]" />
      <Handle type="target" position={Position.Left} id="right" className="w-3 h-3 top-[70%]" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});

JoinNode.displayName = 'JoinNode';
