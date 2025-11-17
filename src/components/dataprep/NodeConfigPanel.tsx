import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Node } from '@xyflow/react';
import { Play, Plus, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useState } from 'react';

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
      const selectedSheet = sheetNames[0];
      const worksheet = workbook.Sheets[selectedSheet];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
      
      onUpdateNode(selectedNode.id, {
        ...selectedNode.data,
        config: {
          ...(selectedNode.data as any).config,
          fileName: file.name,
          sheets: sheetNames,
          workbook: workbook,
          selectedSheet,
          columns,
          data: jsonData,
        }
      });
    };
    reader.readAsBinaryString(file);
  };

  const nodeData = selectedNode.data as any;
  const [filterConditions, setFilterConditions] = useState<any[]>(nodeData.config?.filterConditions || [{ column: '', operator: 'equals', value: '' }]);

  const getDataTypeFromValue = (value: any): string => {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (!isNaN(Date.parse(value))) return 'date';
    return 'text';
  };

  const getOperatorsForType = (type: string) => {
    switch (type) {
      case 'number':
        return ['equals', 'not equals', 'greater than', 'less than', 'greater or equal', 'less or equal', 'between'];
      case 'date':
        return ['equals', 'not equals', 'before', 'after', 'between'];
      case 'boolean':
        return ['is true', 'is false'];
      default:
        return ['equals', 'not equals', 'contains', 'starts with', 'ends with', 'is empty', 'is not empty'];
    }
  };

  const addFilterCondition = () => {
    const newConditions = [...filterConditions, { column: '', operator: 'equals', value: '' }];
    setFilterConditions(newConditions);
    onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, filterConditions: newConditions } });
  };

  const removeFilterCondition = (index: number) => {
    const newConditions = filterConditions.filter((_, i) => i !== index);
    setFilterConditions(newConditions);
    onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, filterConditions: newConditions } });
  };

  const updateFilterCondition = (index: number, field: string, value: any) => {
    const newConditions = [...filterConditions];
    newConditions[index][field] = value;
    setFilterConditions(newConditions);
    onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, filterConditions: newConditions } });
  };

  const availableColumns = nodeData.config?.columns || [];

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
                <Select value={nodeData.config?.selectedSheet || ''} onValueChange={(value) => {
                  const worksheet = nodeData.config.workbook.Sheets[value];
                  const jsonData = XLSX.utils.sheet_to_json(worksheet);
                  const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
                  onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, selectedSheet: value, columns, data: jsonData } });
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choose sheet" /></SelectTrigger>
                  <SelectContent>{nodeData.config.sheets.map((sheet: string) => <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {nodeData.config?.columns && (
              <div>
                <Label className="text-xs text-muted-foreground">Columns detected: {nodeData.config.columns.length}</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {nodeData.config.columns.map((col: string) => (
                    <Badge key={col} variant="secondary" className="text-xs">{col}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'filter':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Filter Conditions</Label>
              <Button size="sm" variant="outline" onClick={addFilterCondition} className="h-7">
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </div>
            {filterConditions.map((condition, index) => {
              const columnType = condition.column && nodeData.config?.data 
                ? getDataTypeFromValue(nodeData.config.data[0]?.[condition.column])
                : 'text';
              const operators = getOperatorsForType(columnType);
              
              return (
                <div key={index} className="p-3 border rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Condition {index + 1}</Label>
                    {filterConditions.length > 1 && (
                      <Button size="sm" variant="ghost" onClick={() => removeFilterCondition(index)} className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Column</Label>
                    <Select value={condition.column} onValueChange={(value) => updateFilterCondition(index, 'column', value)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue placeholder="Select column" /></SelectTrigger>
                      <SelectContent>
                        {availableColumns.map((col: string) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {condition.column && <Badge variant="outline" className="text-xs mt-1">{columnType}</Badge>}
                  </div>
                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select value={condition.operator} onValueChange={(value) => updateFilterCondition(index, 'operator', value)}>
                      <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!['is empty', 'is not empty', 'is true', 'is false'].includes(condition.operator) && (
                    <div>
                      <Label className="text-xs">Value</Label>
                      <Input 
                        type={columnType === 'number' ? 'number' : columnType === 'date' ? 'date' : 'text'}
                        value={condition.value} 
                        onChange={(e) => updateFilterCondition(index, 'value', e.target.value)} 
                        className="mt-1 h-8"
                        placeholder="Enter value"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div>
              <Label className="text-xs">Logic</Label>
              <Select value={nodeData.config?.filterLogic || 'AND'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, filterLogic: value } })}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND (All conditions must match)</SelectItem>
                  <SelectItem value="OR">OR (Any condition can match)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <Label>Select Columns</Label>
            <ScrollArea className="h-48 border rounded-md p-3">
              {availableColumns.map((col: string) => (
                <div key={col} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={col}
                    checked={nodeData.config?.selectedColumns?.includes(col) || false}
                    onCheckedChange={(checked) => {
                      const currentSelected = nodeData.config?.selectedColumns || [];
                      const newSelected = checked 
                        ? [...currentSelected, col]
                        : currentSelected.filter((c: string) => c !== col);
                      onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, selectedColumns: newSelected } });
                    }}
                  />
                  <Label htmlFor={col} className="text-sm font-normal cursor-pointer">{col}</Label>
                </div>
              ))}
            </ScrollArea>
          </div>
        );

      case 'transform':
        return (
          <div className="space-y-4">
            <div>
              <Label>Column to Transform</Label>
              <Select value={nodeData.config?.transformColumn || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, transformColumn: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operation</Label>
              <Select value={nodeData.config?.transformOperation || 'uppercase'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, transformOperation: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="lowercase">Lowercase</SelectItem>
                  <SelectItem value="trim">Trim Whitespace</SelectItem>
                  <SelectItem value="multiply">Multiply by</SelectItem>
                  <SelectItem value="divide">Divide by</SelectItem>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                  <SelectItem value="replace">Replace Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {['multiply', 'divide', 'add', 'subtract'].includes(nodeData.config?.transformOperation) && (
              <div>
                <Label>Value</Label>
                <Input 
                  type="number" 
                  value={nodeData.config?.transformValue || ''} 
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, transformValue: e.target.value } })}
                  className="mt-1"
                  placeholder="Enter number"
                />
              </div>
            )}
            {nodeData.config?.transformOperation === 'replace' && (
              <>
                <div>
                  <Label>Find</Label>
                  <Input 
                    value={nodeData.config?.findText || ''} 
                    onChange={(e) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, findText: e.target.value } })}
                    className="mt-1"
                    placeholder="Text to find"
                  />
                </div>
                <div>
                  <Label>Replace with</Label>
                  <Input 
                    value={nodeData.config?.replaceText || ''} 
                    onChange={(e) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, replaceText: e.target.value } })}
                    className="mt-1"
                    placeholder="Replacement text"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 'aggregate':
        return (
          <div className="space-y-4">
            <div>
              <Label>Group By Columns</Label>
              <ScrollArea className="h-32 border rounded-md p-3 mt-1">
                {availableColumns.map((col: string) => (
                  <div key={col} className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id={`group-${col}`}
                      checked={nodeData.config?.groupByColumns?.includes(col) || false}
                      onCheckedChange={(checked) => {
                        const current = nodeData.config?.groupByColumns || [];
                        const updated = checked ? [...current, col] : current.filter((c: string) => c !== col);
                        onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, groupByColumns: updated } });
                      }}
                    />
                    <Label htmlFor={`group-${col}`} className="text-sm font-normal cursor-pointer">{col}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div>
              <Label>Aggregation Column</Label>
              <Select value={nodeData.config?.aggregateColumn || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, aggregateColumn: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Function</Label>
              <Select value={nodeData.config?.aggregateFunction || 'sum'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, aggregateFunction: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                  <SelectItem value="median">Median</SelectItem>
                  <SelectItem value="stddev">Standard Deviation</SelectItem>
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
              <Select value={nodeData.config?.sortColumn || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, sortColumn: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order</Label>
              <Select value={nodeData.config?.sortOrder || 'asc'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, sortOrder: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending (A→Z, 0→9)</SelectItem>
                  <SelectItem value="desc">Descending (Z→A, 9→0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'join':
        return (
          <div className="space-y-4">
            <div>
              <Label>Join Type</Label>
              <Select value={nodeData.config?.joinType || 'inner'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, joinType: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inner">Inner Join (matching records)</SelectItem>
                  <SelectItem value="left">Left Join (all from left)</SelectItem>
                  <SelectItem value="right">Right Join (all from right)</SelectItem>
                  <SelectItem value="outer">Full Outer Join (all records)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Left Key Column</Label>
              <Select value={nodeData.config?.leftKey || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, leftKey: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Right Key Column</Label>
              <Select value={nodeData.config?.rightKey || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, rightKey: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select column" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'ml_classification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Algorithm</Label>
              <Select value={nodeData.config?.mlAlgorithm || 'decision_tree'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, mlAlgorithm: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="decision_tree">Decision Tree</SelectItem>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                  <SelectItem value="svm">Support Vector Machine</SelectItem>
                  <SelectItem value="naive_bayes">Naive Bayes</SelectItem>
                  <SelectItem value="knn">K-Nearest Neighbors</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Column (to predict)</Label>
              <Select value={nodeData.config?.targetColumn || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, targetColumn: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select target" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Feature Columns</Label>
              <ScrollArea className="h-32 border rounded-md p-3 mt-1">
                {availableColumns.map((col: string) => (
                  <div key={col} className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id={`feature-${col}`}
                      checked={nodeData.config?.featureColumns?.includes(col) || false}
                      onCheckedChange={(checked) => {
                        const current = nodeData.config?.featureColumns || [];
                        const updated = checked ? [...current, col] : current.filter((c: string) => c !== col);
                        onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, featureColumns: updated } });
                      }}
                    />
                    <Label htmlFor={`feature-${col}`} className="text-sm font-normal cursor-pointer">{col}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div>
              <Label>Train/Test Split (%)</Label>
              <Input 
                type="number" 
                min="50" 
                max="90" 
                value={nodeData.config?.trainSplit || 80} 
                onChange={(e) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, trainSplit: e.target.value } })}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'ml_regression':
        return (
          <div className="space-y-4">
            <div>
              <Label>Algorithm</Label>
              <Select value={nodeData.config?.mlAlgorithm || 'linear_regression'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, mlAlgorithm: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear_regression">Linear Regression</SelectItem>
                  <SelectItem value="polynomial_regression">Polynomial Regression</SelectItem>
                  <SelectItem value="ridge_regression">Ridge Regression</SelectItem>
                  <SelectItem value="lasso_regression">Lasso Regression</SelectItem>
                  <SelectItem value="random_forest">Random Forest Regressor</SelectItem>
                  <SelectItem value="gradient_boosting">Gradient Boosting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Column (to predict)</Label>
              <Select value={nodeData.config?.targetColumn || ''} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, targetColumn: value } })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select target" /></SelectTrigger>
                <SelectContent>
                  {availableColumns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Feature Columns</Label>
              <ScrollArea className="h-32 border rounded-md p-3 mt-1">
                {availableColumns.map((col: string) => (
                  <div key={col} className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id={`feature-${col}`}
                      checked={nodeData.config?.featureColumns?.includes(col) || false}
                      onCheckedChange={(checked) => {
                        const current = nodeData.config?.featureColumns || [];
                        const updated = checked ? [...current, col] : current.filter((c: string) => c !== col);
                        onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, featureColumns: updated } });
                      }}
                    />
                    <Label htmlFor={`feature-${col}`} className="text-sm font-normal cursor-pointer">{col}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        );

      case 'ml_clustering':
        return (
          <div className="space-y-4">
            <div>
              <Label>Algorithm</Label>
              <Select value={nodeData.config?.mlAlgorithm || 'kmeans'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, mlAlgorithm: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kmeans">K-Means</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical Clustering</SelectItem>
                  <SelectItem value="dbscan">DBSCAN</SelectItem>
                  <SelectItem value="gaussian_mixture">Gaussian Mixture Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Clusters</Label>
              <Input 
                type="number" 
                min="2" 
                max="20" 
                value={nodeData.config?.numClusters || 3} 
                onChange={(e) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, numClusters: e.target.value } })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Feature Columns</Label>
              <ScrollArea className="h-32 border rounded-md p-3 mt-1">
                {availableColumns.map((col: string) => (
                  <div key={col} className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id={`feature-${col}`}
                      checked={nodeData.config?.featureColumns?.includes(col) || false}
                      onCheckedChange={(checked) => {
                        const current = nodeData.config?.featureColumns || [];
                        const updated = checked ? [...current, col] : current.filter((c: string) => c !== col);
                        onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, featureColumns: updated } });
                      }}
                    />
                    <Label htmlFor={`feature-${col}`} className="text-sm font-normal cursor-pointer">{col}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        );

      case 'output':
        return (
          <div className="space-y-4">
            <div>
              <Label>Output Format</Label>
              <Select value={nodeData.config?.outputFormat || 'excel'} onValueChange={(value) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, outputFormat: value } })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                  <SelectItem value="table">View Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {nodeData.config?.outputFormat !== 'table' && (
              <div>
                <Label>File Name</Label>
                <Input 
                  value={nodeData.config?.outputFileName || 'output'} 
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...nodeData, config: { ...nodeData.config, outputFileName: e.target.value } })}
                  className="mt-1"
                  placeholder="Enter file name"
                />
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No configuration available</p>;
    }
  };

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-lg">Node Config</CardTitle>
          <Badge variant="outline">{selectedNode.type}</Badge>
        </div>
        <Button onClick={() => onRunNode(selectedNode.id)} className="w-full" size="sm">
          <Play className="h-4 w-4 mr-2" />Apply & Run
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-260px)]">
          <div className="px-6 py-4 space-y-4">
            {renderConfig()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
