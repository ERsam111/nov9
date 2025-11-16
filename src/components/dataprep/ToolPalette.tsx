import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileUp,
  Filter,
  Merge,
  Wand2,
  Download,
  Calculator,
  ArrowUpDown,
  Database,
  Split,
  Copy,
} from 'lucide-react';

const tools = [
  {
    category: 'Input/Output',
    items: [
      { type: 'input', label: 'Input Data', icon: FileUp, description: 'Upload Excel, CSV files' },
      { type: 'output', label: 'Output', icon: Download, description: 'Export processed data' },
    ],
  },
  {
    category: 'Data Preparation',
    items: [
      { type: 'filter', label: 'Filter', icon: Filter, description: 'Filter rows by conditions' },
      { type: 'sort', label: 'Sort', icon: ArrowUpDown, description: 'Sort data by columns' },
      { type: 'transform', label: 'Transform', icon: Wand2, description: 'Modify column values' },
      { type: 'select', label: 'Select', icon: Copy, description: 'Select specific columns' },
    ],
  },
  {
    category: 'Data Joining',
    items: [
      { type: 'join', label: 'Join', icon: Merge, description: 'Join multiple datasets' },
      { type: 'union', label: 'Union', icon: Database, description: 'Combine datasets vertically' },
      { type: 'split', label: 'Split', icon: Split, description: 'Split data into groups' },
    ],
  },
  {
    category: 'Analytics',
    items: [
      { type: 'aggregate', label: 'Aggregate', icon: Calculator, description: 'Sum, count, avg, etc.' },
    ],
  },
  {
    category: 'Supervised Learning',
    items: [
      { type: 'ml_classification', label: 'Classification', icon: Split, description: 'Train classification models' },
      { type: 'ml_regression', label: 'Regression', icon: Calculator, description: 'Train regression models' },
      { type: 'ml_clustering', label: 'Clustering', icon: Database, description: 'Cluster analysis' },
    ],
  },
];

export const ToolPalette = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Tool Palette</CardTitle>
        <p className="text-xs text-muted-foreground">Drag tools to canvas</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-3 pb-4 space-y-3">
            {tools.map((category) => (
              <div key={category.category}>
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground px-1">
                  {category.category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {category.items.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <TooltipProvider key={tool.type}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={(e) => onDragStart(e, tool.type)}
                              className="p-2 bg-card border rounded-md cursor-move hover:border-primary hover:bg-accent hover:scale-105 transition-all group"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                  <Icon className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <p className="text-[10px] font-medium text-center leading-tight">{tool.label}</p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-semibold mb-1">{tool.label}</p>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
