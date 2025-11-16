import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Node } from '@xyflow/react';
import { FileUp, Play } from 'lucide-react';
import * as XLSX from 'xlsx';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
  onRunNode: (nodeId: string) => void;
}

export const NodeConfigPanel = ({ selectedNode, onUpdateNode, onRunNode }: NodeConfigPanelProps) => {
  if (!selectedNode) {
    return (
      <Card className="h-full border-2">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Select a node to configure</p>
        </CardContent>
      </Card>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetNames = workbook.SheetNames;
      
      onUpdateNode(selectedNode.id, {
        ...(selectedNode.data as any),
        fileName: file.name,
        sheets: sheetNames,
        workbook: workbook,
      });
    };
    reader.readAsBinaryString(file);
  };

  const nodeData = selectedNode.data as any;

  const renderConfig = () => {
    switch (selectedNode.type) {
      case 'input':
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Data File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {nodeData.fileName && (
                <p className="text-xs text-muted-foreground mt-2">
                  Loaded: {nodeData.fileName}
                </p>
              )}
            </div>
            {nodeData.sheets && (
              <div>
                <Label>Select Sheet</Label>
                <Select
                  value={nodeData.selectedSheet}
                  onValueChange={(value) =>
                    onUpdateNode(selectedNode.id, {
                      ...nodeData,
                      selectedSheet: value,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeData.sheets.map((sheet: string) => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 'filter':
        return (
          <div className="space-y-4">
            <div>
              <Label>Filter Condition</Label>
              <Textarea
                placeholder="e.g., Column1 > 100 AND Column2 = 'Active'"
                value={nodeData.config?.condition || ''}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, condition: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'join':
        return (
          <div className="space-y-4">
            <div>
              <Label>Join Type</Label>
              <Select
                value={nodeData.config?.joinType || 'inner'}
                onValueChange={(value) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, joinType: value },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inner">Inner Join</SelectItem>
                  <SelectItem value="left">Left Join</SelectItem>
                  <SelectItem value="right">Right Join</SelectItem>
                  <SelectItem value="outer">Full Outer Join</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Join Key</Label>
              <Input
                placeholder="Column name"
                value={nodeData.config?.joinKey || ''}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, joinKey: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'transform':
        return (
          <div className="space-y-4">
            <div>
              <Label>Transformation</Label>
              <Textarea
                placeholder="e.g., NewColumn = Column1 * 1.1"
                value={nodeData.config?.transformation || ''}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, transformation: e.target.value },
                  })
                }
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>
        );

      case 'aggregate':
        return (
          <div className="space-y-4">
            <div>
              <Label>Group By Column</Label>
              <Input
                placeholder="Column name"
                value={nodeData.config?.groupBy || ''}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, groupBy: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Aggregation</Label>
              <Select
                value={nodeData.config?.aggregation || 'sum'}
                onValueChange={(value) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, aggregation: value },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'sort':
        return (
          <div className="space-y-4">
            <div>
              <Label>Sort By Column</Label>
              <Input
                placeholder="Column name"
                value={nodeData.config?.sortBy || ''}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, sortBy: e.target.value },
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Order</Label>
              <Select
                value={nodeData.config?.order || 'asc'}
                onValueChange={(value) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, order: value },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'output':
        return (
          <div className="space-y-4">
            <div>
              <Label>Output Format</Label>
              <Select
                value={nodeData.config?.format || 'xlsx'}
                onValueChange={(value) =>
                  onUpdateNode(selectedNode.id, {
                    ...nodeData,
                    config: { ...nodeData.config, format: value },
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No configuration available</p>;
    }
  };

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Node Configuration</CardTitle>
          <Badge variant="outline">{selectedNode.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4">
            {renderConfig()}
            <Button
              onClick={() => onRunNode(selectedNode.id)}
              className="w-full mt-4"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Node
            </Button>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
