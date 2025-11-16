import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
          <div className="px-4 pb-4 space-y-4">
            {tools.map((category) => (
              <div key={category.category}>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, tool.type)}
                        className="p-3 bg-card border rounded-lg cursor-move hover:border-primary hover:bg-accent transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{tool.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
