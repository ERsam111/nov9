import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, MessageSquare, Code, Download } from 'lucide-react';
import { DataUploadPanel } from './DataUploadPanel';
import { TransformationChat } from './TransformationChat';
import { SQLHistory } from './SQLHistory';
import { DataPreview } from './DataPreview';
import { ExportPanel } from './ExportPanel';

interface DataPrepWorkflowProps {
  scenario: any;
}

export const DataPrepWorkflow = ({ scenario }: DataPrepWorkflowProps) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [rawData, setRawData] = useState<any[]>([]);
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [sqlHistory, setSqlHistory] = useState<any[]>([]);

  // Load existing data and history when scenario changes
  useEffect(() => {
    if (scenario?.id) {
      loadScenarioData();
      loadSQLHistory();
    }
  }, [scenario?.id]);

  const loadScenarioData = async () => {
    // Load raw and transformed data from scenario_inputs/outputs
    // Implementation depends on your data structure
  };

  const loadSQLHistory = async () => {
    // Load SQL transformation history from database
    // Implementation will query data_transformation_history table
  };

  const handleDataUpload = (data: any[]) => {
    setRawData(data);
    setTransformedData(data); // Initially same as raw
    setActiveTab('chat');
  };

  const handleTransformation = (newData: any[], sqlQuery: string, description: string) => {
    setTransformedData(newData);
    setSqlHistory([...sqlHistory, {
      query: sqlQuery,
      description,
      timestamp: new Date(),
      sequence: sqlHistory.length + 1
    }]);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2" disabled={rawData.length === 0}>
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Transform</span>
          </TabsTrigger>
          <TabsTrigger value="sql" className="flex items-center gap-2" disabled={sqlHistory.length === 0}>
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">SQL History</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2" disabled={transformedData.length === 0}>
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2" disabled={transformedData.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <DataUploadPanel onDataUpload={handleDataUpload} scenario={scenario} />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <TransformationChat
            scenario={scenario}
            rawData={rawData}
            currentData={transformedData}
            onTransformation={handleTransformation}
          />
        </TabsContent>

        <TabsContent value="sql" className="mt-6">
          <SQLHistory history={sqlHistory} onRevert={(index) => {
            // Handle reverting to a specific transformation
            setSqlHistory(sqlHistory.slice(0, index + 1));
          }} />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <DataPreview data={transformedData} />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <ExportPanel data={transformedData} scenario={scenario} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
