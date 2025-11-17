import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, ArrowUpDown, Columns, Edit2, Type, Calculator, 
  Layers, Users, Droplet, Columns3, Link2, GitMerge, GitBranch,
  Table2, Shuffle, ListFilter, ArrowDownUp, BarChart3, Download
} from 'lucide-react';
import { ActionWidget } from '@/types/dataprep';
import { cn } from '@/lib/utils';

interface ActionWidgetsProps {
  onAddStep: (type: string) => void;
}

const widgets: ActionWidget[] = [
  { type: 'selectColumns', name: 'Select Columns', icon: 'Columns', description: 'Keep or drop columns', category: 'basic' },
  { type: 'filterRows', name: 'Filter Rows', icon: 'Filter', description: 'Filter based on conditions', category: 'basic' },
  { type: 'sortRows', name: 'Sort Rows', icon: 'ArrowUpDown', description: 'Sort by columns', category: 'basic' },
  { type: 'renameColumn', name: 'Rename Column', icon: 'Edit2', description: 'Change column names', category: 'basic' },
  { type: 'changeType', name: 'Change Data Type', icon: 'Type', description: 'Convert column types', category: 'transform' },
  { type: 'calculatedColumn', name: 'Calculated Column', icon: 'Calculator', description: 'Create from formula', category: 'transform' },
  { type: 'groupAggregate', name: 'Group & Aggregate', icon: 'Layers', description: 'Group and compute aggregates', category: 'transform' },
  { type: 'removeDuplicates', name: 'Remove Duplicates', icon: 'Users', description: 'Drop duplicate rows', category: 'basic' },
  { type: 'fillMissing', name: 'Fill Missing Values', icon: 'Droplet', description: 'Handle null values', category: 'transform' },
  { type: 'splitColumn', name: 'Split Column', icon: 'Columns3', description: 'Split into multiple columns', category: 'transform' },
  { type: 'mergeColumns', name: 'Merge Columns', icon: 'Link2', description: 'Combine columns', category: 'transform' },
  { type: 'joinDatasets', name: 'Join Datasets', icon: 'GitMerge', description: 'Join with another dataset', category: 'combine' },
  { type: 'unionDatasets', name: 'Union Datasets', icon: 'GitBranch', description: 'Append rows from dataset', category: 'combine' },
  { type: 'pivot', name: 'Pivot', icon: 'Table2', description: 'Turn rows into columns', category: 'advanced' },
  { type: 'unpivot', name: 'Unpivot', icon: 'Shuffle', description: 'Turn columns into rows', category: 'advanced' },
  { type: 'sample', name: 'Sample / Limit', icon: 'ListFilter', description: 'Limit or sample rows', category: 'basic' },
  { type: 'conditionalReplace', name: 'Conditional Replace', icon: 'ArrowDownUp', description: 'Find and replace values', category: 'transform' },
  { type: 'reorderColumns', name: 'Reorder Columns', icon: 'ArrowUpDown', description: 'Change column order', category: 'basic' },
  { type: 'dataProfile', name: 'Data Profile', icon: 'BarChart3', description: 'Show stats and validation', category: 'advanced' },
  { type: 'exportDataset', name: 'Export Dataset', icon: 'Download', description: 'Save or download data', category: 'export' },
];

const iconMap: Record<string, any> = {
  Columns, Filter, ArrowUpDown, Edit2, Type, Calculator, Layers, Users,
  Droplet, Columns3, Link2, GitMerge, GitBranch, Table2, Shuffle,
  ListFilter, ArrowDownUp, BarChart3, Download
};

const categoryColors: Record<string, string> = {
  basic: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  transform: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  combine: 'bg-green-500/10 text-green-500 border-green-500/20',
  advanced: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  export: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
};

export const ActionWidgets = ({ onAddStep }: ActionWidgetsProps) => {
  const categories = ['basic', 'transform', 'combine', 'advanced', 'export'];

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Data Actions</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Click to add steps to your pipeline
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {categories.map((category) => (
            <div key={category} className="p-3 border-b last:border-b-0">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {widgets
                  .filter((w) => w.category === category)
                  .map((widget) => {
                    const Icon = iconMap[widget.icon];
                    return (
                      <div
                        key={widget.type}
                        className={cn(
                          'p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md group',
                          categoryColors[category]
                        )}
                        onClick={() => onAddStep(widget.type)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 pt-0.5">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs group-hover:underline">
                              {widget.name}
                            </p>
                            <p className="text-[10px] opacity-80 mt-0.5">
                              {widget.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
