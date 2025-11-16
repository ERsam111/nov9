import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SQLHistoryProps {
  history: Array<{
    query: string;
    description: string;
    timestamp: Date;
    sequence: number;
  }>;
  onRevert: (index: number) => void;
}

export const SQLHistory = ({ history, onRevert }: SQLHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          SQL Transformation History
        </CardTitle>
        <CardDescription>
          Complete audit trail of all data transformations applied to your dataset
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transformations yet. Use the Transform tab to start modifying your data.
              </p>
            ) : (
              history.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                          Step {item.sequence}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(item.timestamp, 'PPp')}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{item.description}</p>
                      <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                        <code>{item.query}</code>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRevert(index)}
                      className="ml-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
