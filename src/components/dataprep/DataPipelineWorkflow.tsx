import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Upload } from 'lucide-react';
import { DataStep, ColumnInfo, DatasetPreview } from '@/types/dataprep';
import { ActionWidgets } from './ActionWidgets';
import { StepPipeline } from './StepPipeline';
import { StepConfig } from './StepConfig';
import { ColumnPanel } from './ColumnPanel';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface DataPipelineWorkflowProps {
  project: any;
}

export const DataPipelineWorkflow = ({ project }: DataPipelineWorkflowProps) => {
  const [steps, setSteps] = useState<DataStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [sourceData, setSourceData] = useState<any[] | null>(null);
  const [currentData, setCurrentData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('No data found in file');
          return;
        }

        const cols: ColumnInfo[] = Object.keys(jsonData[0]).map((name) => ({
          name,
          type: inferType(jsonData[0][name]),
          sampleValue: jsonData[0][name],
        }));

        setSourceData(jsonData);
        setCurrentData(jsonData);
        setColumns(cols);
        toast.success(`Loaded ${jsonData.length} rows from ${file.name}`);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      toast.error('Failed to load file');
      console.error(error);
    }
  };

  const inferType = (value: any): ColumnInfo['type'] => {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (!isNaN(Date.parse(value))) return 'date';
    return 'string';
  };

  const handleAddStep = (type: string) => {
    const newStep: DataStep = {
      id: `step-${Date.now()}`,
      type: type as any,
      label: type.replace(/([A-Z])/g, ' $1').trim(),
      isActive: true,
      config: {},
      usedColumns: [],
      order: steps.length,
    };
    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
    toast.success('Step added to pipeline');
  };

  const handleStepUpdate = (stepId: string, updates: Partial<DataStep>) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const handleConfigUpdate = (config: any) => {
    if (!selectedStepId) return;
    const step = steps.find((s) => s.id === selectedStepId);
    if (!step) return;

    // Extract used columns from config
    let usedColumns: string[] = [];
    if (config.columns) usedColumns = config.columns;
    if (config.conditions) usedColumns = config.conditions.map((c: any) => c.column).filter(Boolean);
    if (config.sortKeys) usedColumns = config.sortKeys.map((k: any) => k.column).filter(Boolean);
    if (config.groupBy) usedColumns = [...config.groupBy, ...(config.aggregations || []).map((a: any) => a.column)];

    // Handle label update
    if (config._label !== undefined) {
      handleStepUpdate(selectedStepId, { label: config._label, config: { ...step.config, ...config } });
      return;
    }

    handleStepUpdate(selectedStepId, { config, usedColumns });
  };

  const handleStepDelete = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i })));
    if (selectedStepId === stepId) setSelectedStepId(null);
    toast.success('Step deleted');
  };

  const handleStepDuplicate = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;
    const newStep = { ...step, id: `step-${Date.now()}`, order: steps.length };
    setSteps([...steps, newStep]);
    toast.success('Step duplicated');
  };

  const handleStepReorder = (stepId: string, newOrder: number) => {
    const oldIndex = steps.findIndex((s) => s.id === stepId);
    const newIndex = steps.findIndex((s) => s.order === newOrder);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...steps];
    const [movedStep] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedStep);
    setSteps(reordered.map((s, i) => ({ ...s, order: i })));
  };

  const executeStep = (data: any[], step: DataStep): any[] => {
    if (!step.isActive) return data;

    try {
      switch (step.type) {
        case 'selectColumns':
          if (step.config.mode === 'drop') {
            return data.map(row => {
              const newRow = { ...row };
              step.config.columns?.forEach((col: string) => delete newRow[col]);
              return newRow;
            });
          } else {
            return data.map(row => {
              const newRow: any = {};
              step.config.columns?.forEach((col: string) => {
                if (col in row) newRow[col] = row[col];
              });
              return newRow;
            });
          }

        case 'filterRows':
          return data.filter(row => {
            const conditions = step.config.conditions || [];
            const logic = step.config.logic || 'AND';
            
            const results = conditions.map((cond: any) => {
              const value = row[cond.column];
              const compareValue = cond.value;
              
              switch (cond.operator) {
                case 'equals': return value == compareValue;
                case 'notEquals': return value != compareValue;
                case 'contains': return String(value).includes(compareValue);
                case 'startsWith': return String(value).startsWith(compareValue);
                case 'endsWith': return String(value).endsWith(compareValue);
                case 'greaterThan': return Number(value) > Number(compareValue);
                case 'lessThan': return Number(value) < Number(compareValue);
                case 'isEmpty': return value === null || value === undefined || value === '';
                case 'isNotEmpty': return value !== null && value !== undefined && value !== '';
                default: return true;
              }
            });

            return logic === 'AND' ? results.every(r => r) : results.some(r => r);
          });

        case 'sortRows':
          return [...data].sort((a, b) => {
            for (const key of step.config.sortKeys || []) {
              const aVal = a[key.column];
              const bVal = b[key.column];
              const direction = key.direction === 'asc' ? 1 : -1;
              
              if (aVal < bVal) return -1 * direction;
              if (aVal > bVal) return 1 * direction;
            }
            return 0;
          });

        case 'renameColumn':
          return data.map(row => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
              const newKey = step.config.renames?.[key] || key;
              newRow[newKey] = row[key];
            });
            return newRow;
          });

        case 'removeDuplicates':
          const seen = new Set();
          return data.filter(row => {
            const key = JSON.stringify(row);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        case 'sample':
          const limit = step.config.limit || 100;
          return data.slice(0, limit);

        case 'groupAggregate':
          const groups = new Map();
          const groupBy = step.config.groupBy || [];
          
          data.forEach(row => {
            const key = groupBy.map((col: string) => row[col]).join('||');
            if (!groups.has(key)) {
              const groupRow: any = {};
              groupBy.forEach((col: string) => groupRow[col] = row[col]);
              groups.set(key, { row: groupRow, values: [] });
            }
            groups.get(key).values.push(row);
          });

          return Array.from(groups.values()).map(group => {
            const result = { ...group.row };
            (step.config.aggregations || []).forEach((agg: any) => {
              const values = group.values.map((r: any) => r[agg.column]).filter((v: any) => v != null);
              
              switch (agg.function) {
                case 'sum':
                  result[agg.outputName || `${agg.column}_sum`] = values.reduce((a: number, b: number) => a + Number(b), 0);
                  break;
                case 'avg':
                  result[agg.outputName || `${agg.column}_avg`] = values.reduce((a: number, b: number) => a + Number(b), 0) / values.length;
                  break;
                case 'count':
                  result[agg.outputName || `${agg.column}_count`] = values.length;
                  break;
                case 'min':
                  result[agg.outputName || `${agg.column}_min`] = Math.min(...values.map(Number));
                  break;
                case 'max':
                  result[agg.outputName || `${agg.column}_max`] = Math.max(...values.map(Number));
                  break;
              }
            });
            return result;
          });

        default:
          return data;
      }
    } catch (error) {
      console.error(`Error executing step ${step.type}:`, error);
      toast.error(`Error in step "${step.label}"`);
      return data;
    }
  };

  const handleRunToStep = (stepId: string) => {
    if (!sourceData) {
      toast.error('Please upload data first');
      return;
    }
    
    const targetIndex = steps.findIndex(s => s.id === stepId);
    const stepsToRun = steps.slice(0, targetIndex + 1).filter(s => s.isActive);
    
    let processedData = sourceData;
    for (const step of stepsToRun) {
      processedData = executeStep(processedData, step);
    }
    
    // Update columns based on processed data
    if (processedData.length > 0) {
      const cols: ColumnInfo[] = Object.keys(processedData[0]).map((name) => ({
        name,
        type: inferType(processedData[0][name]),
        sampleValue: processedData[0][name],
      }));
      setColumns(cols);
    }
    
    setCurrentData(processedData);
    toast.success(`Executed ${stepsToRun.length} steps`);
  };

  const handleRunAll = () => {
    if (!sourceData) {
      toast.error('Please upload data first');
      return;
    }
    
    const activeSteps = steps.filter(s => s.isActive);
    let processedData = sourceData;
    
    for (const step of activeSteps) {
      processedData = executeStep(processedData, step);
    }
    
    // Update columns based on processed data
    if (processedData.length > 0) {
      const cols: ColumnInfo[] = Object.keys(processedData[0]).map((name) => ({
        name,
        type: inferType(processedData[0][name]),
        sampleValue: processedData[0][name],
      }));
      setColumns(cols);
    }
    
    setCurrentData(processedData);
    toast.success(`Executed ${activeSteps.length} steps - ${processedData.length} rows`);
  };

  const handleColumnAction = (action: 'filter' | 'sort' | 'rename' | 'delete', columnName: string) => {
    let newStep: DataStep;
    switch (action) {
      case 'filter':
        newStep = {
          id: `step-${Date.now()}`,
          type: 'filterRows',
          label: `Filter by ${columnName}`,
          isActive: true,
          config: { conditions: [{ column: columnName, operator: 'equals', value: '' }], logic: 'AND' },
          usedColumns: [columnName],
          order: steps.length,
        };
        break;
      case 'sort':
        newStep = {
          id: `step-${Date.now()}`,
          type: 'sortRows',
          label: `Sort by ${columnName}`,
          isActive: true,
          config: { sortKeys: [{ column: columnName, direction: 'asc' }] },
          usedColumns: [columnName],
          order: steps.length,
        };
        break;
      case 'rename':
        newStep = {
          id: `step-${Date.now()}`,
          type: 'renameColumn',
          label: `Rename ${columnName}`,
          isActive: true,
          config: { renames: { [columnName]: '' } },
          usedColumns: [columnName],
          order: steps.length,
        };
        break;
      case 'delete':
        newStep = {
          id: `step-${Date.now()}`,
          type: 'selectColumns',
          label: `Drop ${columnName}`,
          isActive: true,
          config: { mode: 'drop', columns: [columnName] },
          usedColumns: [columnName],
          order: steps.length,
        };
        break;
    }
    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
    toast.success(`Added ${action} step for ${columnName}`);
  };

  return (
    <div className="h-screen w-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Top Action Bar */}
      <Card className="border-2 flex-shrink-0">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="w-64"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </span>
                </Button>
              </label>
            </div>
            <Button onClick={handleRunAll} disabled={!sourceData || steps.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Run All Steps
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Workspace */}
      <div className="flex-shrink-0 h-[calc(45vh-4rem)] grid grid-cols-12 gap-4">
        {/* Left: Action Widgets */}
        <div className="col-span-2 h-full overflow-hidden">
          <ActionWidgets onAddStep={handleAddStep} />
        </div>

        {/* Center: Step Pipeline */}
        <div className="col-span-5 h-full overflow-hidden">
          <Card className="h-full border-2">
            <ScrollArea className="h-full">
              <StepPipeline
                steps={steps}
                selectedStepId={selectedStepId}
                onStepSelect={setSelectedStepId}
                onStepUpdate={handleStepUpdate}
                onStepDelete={handleStepDelete}
                onStepDuplicate={handleStepDuplicate}
                onStepReorder={handleStepReorder}
                onRunToStep={handleRunToStep}
              />
            </ScrollArea>
          </Card>
        </div>

        {/* Right: Step Config + Column Panel */}
        <div className="col-span-5 h-full overflow-hidden flex flex-col gap-4">
          <StepConfig
            step={selectedStep}
            columns={columns}
            onConfigUpdate={handleConfigUpdate}
          />
          {columns.length > 0 && (
            <ColumnPanel
              columns={columns}
              usedColumns={selectedStep?.usedColumns || []}
              onColumnAction={handleColumnAction}
            />
          )}
        </div>
      </div>

      {/* Bottom: Data Preview */}
      {currentData && (
        <Card className="border-2 flex-1 min-h-0">
          <CardContent className="p-4 h-full flex flex-col gap-2">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-semibold">Data Preview ({currentData.length} rows, showing first 100)</h3>
            </div>
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.name} className="font-semibold whitespace-nowrap min-w-[120px]">
                        {col.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.slice(0, 100).map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col.name} className="whitespace-nowrap min-w-[120px]">
                          {row[col.name] !== null && row[col.name] !== undefined
                            ? String(row[col.name])
                            : <span className="text-muted-foreground italic">(empty)</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
