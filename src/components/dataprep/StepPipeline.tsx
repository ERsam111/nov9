import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  GripVertical, Edit2, Copy, Trash2, Play, Eye, EyeOff,
  Filter, ArrowUpDown, Columns, Type, Calculator, Group,
  Users, Droplet, Split, Merge, GitMerge, GitBranch,
  Table2, Shuffle, ListFilter, ArrowDownUp, BarChart3, Download
} from 'lucide-react';
import { DataStep } from '@/types/dataprep';
import { cn } from '@/lib/utils';

interface StepPipelineProps {
  steps: DataStep[];
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
  onStepUpdate: (stepId: string, updates: Partial<DataStep>) => void;
  onStepDelete: (stepId: string) => void;
  onStepDuplicate: (stepId: string) => void;
  onStepReorder: (stepId: string, newOrder: number) => void;
  onRunToStep: (stepId: string) => void;
}

const stepIcons: Record<string, any> = {
  selectColumns: Columns,
  filterRows: Filter,
  sortRows: ArrowUpDown,
  renameColumn: Edit2,
  changeType: Type,
  calculatedColumn: Calculator,
  groupAggregate: Group,
  removeDuplicates: Users,
  fillMissing: Droplet,
  splitColumn: Split,
  mergeColumns: Merge,
  joinDatasets: GitMerge,
  unionDatasets: GitBranch,
  pivot: Table2,
  unpivot: Shuffle,
  sample: ListFilter,
  conditionalReplace: ArrowDownUp,
  reorderColumns: ArrowUpDown,
  dataProfile: BarChart3,
  exportDataset: Download,
};

export const StepPipeline = ({
  steps,
  selectedStepId,
  onStepSelect,
  onStepUpdate,
  onStepDelete,
  onStepDuplicate,
  onStepReorder,
  onRunToStep,
}: StepPipelineProps) => {
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  const getStepSummary = (step: DataStep): string => {
    switch (step.type) {
      case 'selectColumns':
        return step.config?.mode === 'keep' 
          ? `Keep ${step.config?.columns?.length || 0} columns`
          : `Drop ${step.config?.columns?.length || 0} columns`;
      case 'filterRows':
        return `${step.config?.conditions?.length || 0} conditions (${step.config?.logic || 'AND'})`;
      case 'sortRows':
        return `Sort by ${step.config?.sortKeys?.length || 0} column(s)`;
      case 'renameColumn':
        return `Rename ${Object.keys(step.config?.renames || {}).length} column(s)`;
      case 'calculatedColumn':
        return `${step.config?.newColumn || 'NewColumn'} = ${step.config?.expression || '...'}`;
      case 'groupAggregate':
        return `Group by ${step.config?.groupBy?.length || 0}, Aggregate ${step.config?.aggregations?.length || 0}`;
      default:
        return 'Configure this step';
    }
  };

  const StepIcon = ({ type }: { type: string }) => {
    const Icon = stepIcons[type] || Filter;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3 p-4">
      {steps.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">
              Drag widgets from the left panel to build your pipeline
            </p>
          </CardContent>
        </Card>
      )}

      {steps.map((step, index) => (
        <Card
          key={step.id}
          className={cn(
            'transition-all cursor-pointer border-2',
            selectedStepId === step.id ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50',
            !step.isActive && 'opacity-60',
            draggedStepId === step.id && 'opacity-50'
          )}
          onClick={() => onStepSelect(step.id)}
          draggable
          onDragStart={() => setDraggedStepId(step.id)}
          onDragEnd={() => setDraggedStepId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedStepId && draggedStepId !== step.id) {
              onStepReorder(draggedStepId, step.order);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Drag Handle */}
              <div className="cursor-grab active:cursor-grabbing pt-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Step Number */}
              <div className="flex-shrink-0">
                <Badge variant="outline" className="rounded-full h-7 w-7 flex items-center justify-center font-semibold">
                  {index + 1}
                </Badge>
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StepIcon type={step.type} />
                  <h4 className="font-semibold text-sm truncate">{step.label}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {step.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {getStepSummary(step)}
                </p>
                {step.usedColumns.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {step.usedColumns.slice(0, 5).map((col) => (
                      <Badge key={col} variant="outline" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                    {step.usedColumns.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{step.usedColumns.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="flex items-center gap-1 mr-2">
                  <Switch
                    checked={step.isActive}
                    onCheckedChange={(checked) => onStepUpdate(step.id, { isActive: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {step.isActive ? (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunToStep(step.id);
                  }}
                >
                  <Play className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStepDuplicate(step.id);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStepDelete(step.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
