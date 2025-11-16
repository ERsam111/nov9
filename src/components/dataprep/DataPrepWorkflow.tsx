import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUp, Download } from 'lucide-react';
import { DataUploadPanel } from './DataUploadPanel';
import { ModuleSelector } from './ModuleSelector';
import { TransformationChat } from './TransformationChat';
import { SQLHistory } from './SQLHistory';
import { DataPreview } from './DataPreview';
import { ExportPanel } from './ExportPanel';

interface DataPrepWorkflowProps {
  project: any;
}

export const DataPrepWorkflow = ({ project }: DataPrepWorkflowProps) => {
  const [step, setStep] = useState<'upload' | 'module' | 'transform' | 'export'>('upload');
  const [targetModule, setTargetModule] = useState<'gfa' | 'inventory' | 'forecasting' | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [sqlHistory, setSqlHistory] = useState<any[]>([]);
  const [dataUnderstanding, setDataUnderstanding] = useState<string>('');

  // Load existing data and history when project changes
  useEffect(() => {
    if (project?.id) {
      loadProjectData();
      loadSQLHistory();
    }
  }, [project?.id]);

  const loadProjectData = async () => {
    // Load raw and transformed data from project
    // Implementation depends on your data structure
  };

  const loadSQLHistory = async () => {
    // Load SQL transformation history from database
    // Implementation will query data_transformation_history table
  };

  const handleDataUpload = (data: any[]) => {
    setRawData(data);
    setTransformedData(data); // Initially same as raw
    setStep('module');
  };

  const handleModuleSelect = (module: 'gfa' | 'inventory' | 'forecasting') => {
    setTargetModule(module);
    // Generate initial understanding based on module
    const understanding = `I've analyzed your data for ${module.toUpperCase()} optimization. I can see ${rawData.length} rows with ${Object.keys(rawData[0] || {}).length} columns.`;
    setDataUnderstanding(understanding);
    setStep('transform');
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
      {/* Module Badge */}
      {targetModule && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Target Module:</span>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            {targetModule.toUpperCase()}
          </Badge>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <DataUploadPanel onDataUpload={handleDataUpload} project={project} />
      )}

      {/* Step 2: Module Selection */}
      {step === 'module' && (
        <ModuleSelector onSelect={handleModuleSelect} />
      )}

      {/* Step 3: Transform (3-column layout) */}
      {step === 'transform' && targetModule && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Chat */}
          <div className="col-span-4">
            <TransformationChat
              project={project}
              rawData={rawData}
              currentData={transformedData}
              targetModule={targetModule}
              dataUnderstanding={dataUnderstanding}
              onTransformation={handleTransformation}
            />
          </div>

          {/* Middle: SQL History */}
          <div className="col-span-4">
            <SQLHistory 
              history={sqlHistory} 
              onRevert={(index) => {
                setSqlHistory(sqlHistory.slice(0, index + 1));
              }} 
            />
          </div>

          {/* Right: Data Preview */}
          <div className="col-span-4">
            <DataPreview data={transformedData} />
          </div>
        </div>
      )}

      {/* Export Button */}
      {step === 'transform' && transformedData.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setStep('export')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      )}

      {/* Step 4: Export */}
      {step === 'export' && targetModule && (
        <ExportPanel 
          data={transformedData} 
          project={project}
          targetModule={targetModule}
        />
      )}
    </div>
  );
};
