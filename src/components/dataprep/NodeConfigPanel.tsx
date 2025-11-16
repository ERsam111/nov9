import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Node } from '@xyflow/react';
import { Play } from 'lucide-react';
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
        ...selectedNode.data,
        config: {
          ...(selectedNode.data as any).config,
          fileName: file.name,
          sheets: sheetNames,
          workbook: workbook,
        }
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
              <Label>Upload File</Label>
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="mt-1" />
              {nodeData.config?.fileName && <p className="text-xs text-muted-foreground mt-2">Loaded: {nodeData.config.fileName}</p>}
            </div>
            {nodeData.config?.sheets && (
              <div>
                <Label>Select Sheet</Label>
                <Select value={nodeData.config?.selectedSheet || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, selectedSheet: value } })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choose sheet" /></SelectTrigger>
                  <SelectContent>{nodeData.config.sheets.map((sheet: string) => <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      case 'filter':
      case 'join':
      case 'transform':
      case 'aggregate':
      case 'sort':
      case 'select':
      case 'ml_classification':
      case 'ml_regression':
      case 'ml_clustering':
      case 'output':
        return <p className="text-sm text-muted-foreground">Configure via dropdowns (UI simplified)</p>;
      default:
        return <p className="text-sm text-muted-foreground">No configuration available</p>;
    }
  };

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Node Config</CardTitle>
          <Badge variant="outline">{selectedNode.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="px-6 pb-4 space-y-4">
            {renderConfig()}
            <div className="pt-4 border-t">
              <Button onClick={() => onRunNode(selectedNode.id)} className="w-full">
                <Play className="h-4 w-4 mr-2" />Run Node
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
