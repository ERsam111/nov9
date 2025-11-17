import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColumnInfo } from '@/types/dataprep';
import { Filter, ArrowUpDown, Edit2, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ColumnPanelProps {
  columns: ColumnInfo[];
  usedColumns: string[];
  onColumnAction: (action: 'filter' | 'sort' | 'rename' | 'delete', columnName: string) => void;
}

export const ColumnPanel = ({ columns, usedColumns, onColumnAction }: ColumnPanelProps) => {
  const typeColors: Record<string, string> = {
    string: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    number: 'bg-green-500/10 text-green-600 border-green-500/20',
    integer: 'bg-green-500/10 text-green-600 border-green-500/20',
    date: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    datetime: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    boolean: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  };

  return (
    <Card className="border-2 mt-4">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm">Columns</CardTitle>
        <p className="text-xs text-muted-foreground">
          {columns.length} columns in current dataset
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="p-3 space-y-2">
            {columns.map((col) => (
              <div
                key={col.name}
                className={cn(
                  'p-2 rounded-md border bg-card transition-all',
                  usedColumns.includes(col.name) && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-xs truncate">{col.name}</p>
                      {usedColumns.includes(col.name) && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Used
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', typeColors[col.type])}
                      >
                        {col.type}
                      </Badge>
                      {col.sampleValue !== undefined && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                          e.g. {String(col.sampleValue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => onColumnAction('filter', col.name)}
                          >
                            <Filter className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Filter by this column</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => onColumnAction('sort', col.name)}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sort by this column</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => onColumnAction('rename', col.name)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rename this column</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => onColumnAction('delete', col.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Drop this column</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {col.createdInStep && (
                  <div className="flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      Created in {col.createdInStep}
                    </span>
                  </div>
                )}
                {col.nullCount !== undefined && col.nullCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] mt-1">
                    {col.nullCount} null values
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
