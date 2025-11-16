import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataPreviewPanelProps {
  data: any[] | null;
  nodeId: string | null;
}

export const DataPreviewPanel = ({ data, nodeId }: DataPreviewPanelProps) => {
  if (!data || !nodeId) {
    return (
      <Card className="h-full border-2">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Run a node to preview data</p>
        </CardContent>
      </Card>
    );
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const previewData = data.slice(0, 100);

  // Calculate data quality metrics
  const totalRows = data.length;
  const completeness = columns.map((col) => {
    const nonEmpty = data.filter((row) => row[col] !== null && row[col] !== undefined && row[col] !== '').length;
    return {
      column: col,
      percentage: Math.round((nonEmpty / totalRows) * 100),
      missing: totalRows - nonEmpty,
    };
  });

  const overallCompleteness = Math.round(
    completeness.reduce((acc, col) => acc + col.percentage, 0) / columns.length
  );

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Preview
            </CardTitle>
            <CardDescription className="mt-1">
              Showing {previewData.length} of {data.length} rows
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={overallCompleteness >= 90 ? 'default' : 'destructive'} className="text-xs">
              {overallCompleteness >= 90 ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {overallCompleteness}% Complete
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(50vh-150px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {columns.map((col) => {
                  const colStats = completeness.find((c) => c.column === col);
                  return (
                    <TableHead key={col} className="font-semibold">
                      <div className="space-y-1">
                        <div>{col}</div>
                        {colStats && colStats.missing > 0 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {colStats.missing} missing
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => {
                    const value = row[col];
                    const isEmpty = value === null || value === undefined || value === '';
                    return (
                      <TableCell key={`${idx}-${col}`} className={isEmpty ? 'text-muted-foreground italic' : ''}>
                        {isEmpty ? '(empty)' : String(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
