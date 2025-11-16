import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Merge } from 'lucide-react';

export const JoinNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`px-3 py-2 shadow-md rounded-md bg-card border-2 ${selected ? 'border-primary' : 'border-border'} min-w-[140px] hover:shadow-lg transition-all group`}>
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
          <Merge className="h-3 w-3 text-purple-500" />
        </div>
        <div className="font-semibold text-xs">Join</div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {(data as any).config?.joinType || 'Inner'}
      </div>
      <Handle type="target" position={Position.Left} id="left" className="w-2 h-2 top-[30%]" />
      <Handle type="target" position={Position.Left} id="right" className="w-2 h-2 top-[70%]" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

JoinNode.displayName = 'JoinNode';
