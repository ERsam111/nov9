import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataStep, ColumnInfo } from '@/types/dataprep';
import { Plus, Trash2 } from 'lucide-react';

interface StepConfigProps {
  step: DataStep | null;
  columns: ColumnInfo[];
  onConfigUpdate: (config: any) => void;
}

export const StepConfig = ({ step, columns, onConfigUpdate }: StepConfigProps) => {
  if (!step) {
    return (
      <Card className="h-full border-2">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">Select a step to configure</p>
        </CardContent>
      </Card>
    );
  }

  const config = step.config || {};
  const columnNames = columns.map((c) => c.name);

  const updateConfig = (key: string, value: any) => {
    onConfigUpdate({ ...config, [key]: value });
  };

  const renderConfigForm = () => {
    switch (step.type) {
      case 'selectColumns':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mode</Label>
              <Select value={config.mode || 'keep'} onValueChange={(v) => updateConfig('mode', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep only selected columns</SelectItem>
                  <SelectItem value="drop">Drop selected columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Columns</Label>
              <ScrollArea className="h-48 border rounded-md p-3 mt-1">
                {columnNames.map((col) => (
                  <div key={col} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={col}
                      checked={config.columns?.includes(col) || false}
                      onCheckedChange={(checked) => {
                        const current = config.columns || [];
                        updateConfig('columns', checked ? [...current, col] : current.filter((c: string) => c !== col));
                      }}
                    />
                    <Label htmlFor={col} className="text-sm font-normal cursor-pointer">{col}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        );

      case 'filterRows':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Filter Conditions</Label>
              <Button size="sm" variant="outline" onClick={() => {
                const conditions = config.conditions || [];
                updateConfig('conditions', [...conditions, { column: '', operator: 'equals', value: '' }]);
              }}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </div>
            <ScrollArea className="max-h-64">
              {(config.conditions || [{ column: '', operator: 'equals', value: '' }]).map((cond: any, i: number) => (
                <div key={i} className="p-3 border rounded-md mb-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Condition {i + 1}</Label>
                    {(config.conditions?.length || 0) > 1 && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                        updateConfig('conditions', config.conditions.filter((_: any, idx: number) => idx !== i));
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Select value={cond.column} onValueChange={(v) => {
                    const updated = [...config.conditions];
                    updated[i].column = v;
                    updateConfig('conditions', updated);
                  }}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Column" /></SelectTrigger>
                    <SelectContent>{columnNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={cond.operator} onValueChange={(v) => {
                    const updated = [...config.conditions];
                    updated[i].operator = v;
                    updateConfig('conditions', updated);
                  }}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater">Greater Than</SelectItem>
                      <SelectItem value="less">Less Than</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={cond.value}
                    onChange={(e) => {
                      const updated = [...config.conditions];
                      updated[i].value = e.target.value;
                      updateConfig('conditions', updated);
                    }}
                    placeholder="Value"
                    className="h-8"
                  />
                </div>
              ))}
            </ScrollArea>
            <div>
              <Label className="text-xs">Logic</Label>
              <Select value={config.logic || 'AND'} onValueChange={(v) => updateConfig('logic', v)}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND (All must match)</SelectItem>
                  <SelectItem value="OR">OR (Any can match)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'sortRows':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Sort Keys</Label>
              <Button size="sm" variant="outline" onClick={() => {
                const keys = config.sortKeys || [];
                updateConfig('sortKeys', [...keys, { column: '', direction: 'asc' }]);
              }}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </div>
            {(config.sortKeys || [{ column: '', direction: 'asc' }]).map((key: any, i: number) => (
              <div key={i} className="p-3 border rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Sort Key {i + 1}</Label>
                  {(config.sortKeys?.length || 0) > 1 && (
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                      updateConfig('sortKeys', config.sortKeys.filter((_: any, idx: number) => idx !== i));
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Select value={key.column} onValueChange={(v) => {
                  const updated = [...config.sortKeys];
                  updated[i].column = v;
                  updateConfig('sortKeys', updated);
                }}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Column" /></SelectTrigger>
                  <SelectContent>{columnNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={key.direction} onValueChange={(v) => {
                  const updated = [...config.sortKeys];
                  updated[i].direction = v;
                  updateConfig('sortKeys', updated);
                }}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        );

      case 'calculatedColumn':
        return (
          <div className="space-y-4">
            <div>
              <Label>New Column Name</Label>
              <Input value={config.newColumn || ''} onChange={(e) => updateConfig('newColumn', e.target.value)} className="mt-1" placeholder="NewColumn" />
            </div>
            <div>
              <Label>Expression</Label>
              <Textarea value={config.expression || ''} onChange={(e) => updateConfig('expression', e.target.value)} className="mt-1 font-mono text-sm" placeholder="e.g., Price * Quantity" rows={4} />
              <p className="text-xs text-muted-foreground mt-1">Use column names directly in expressions</p>
            </div>
            <div>
              <Label>Result Type</Label>
              <Select value={config.resultType || 'number'} onValueChange={(v) => updateConfig('resultType', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'renameColumn':
        return (
          <div className="space-y-4">
            <Label>Rename Columns</Label>
            <ScrollArea className="max-h-80">
              {columnNames.map((col) => (
                <div key={col} className="flex items-center gap-2 mb-2">
                  <Label className="text-sm w-32 truncate">{col}</Label>
                  <span className="text-muted-foreground">→</span>
                  <Input
                    value={config.renames?.[col] || ''}
                    onChange={(e) => updateConfig('renames', { ...config.renames, [col]: e.target.value })}
                    placeholder="New name"
                    className="h-8 flex-1"
                  />
                </div>
              ))}
            </ScrollArea>
          </div>
        );

      case 'groupAggregate':
        return (
          <div className="space-y-4">
            <div>
              <Label>Group By Columns</Label>
              <ScrollArea className="h-32 border rounded-md p-3 mt-1">
                {columnNames.map((col) => (
                  <div key={col} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      checked={config.groupBy?.includes(col) || false}
                      onCheckedChange={(checked) => {
                        const current = config.groupBy || [];
                        updateConfig('groupBy', checked ? [...current, col] : current.filter((c: string) => c !== col));
                      }}
                    />
                    <Label className="text-sm font-normal">{col}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Aggregations</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const aggs = config.aggregations || [];
                  updateConfig('aggregations', [...aggs, { column: '', function: 'sum', alias: '' }]);
                }}>
                  <Plus className="h-3 w-3 mr-1" />Add
                </Button>
              </div>
              {(config.aggregations || [{ column: '', function: 'sum', alias: '' }]).map((agg: any, i: number) => (
                <div key={i} className="p-2 border rounded-md mb-2 space-y-2">
                  <Select value={agg.column} onValueChange={(v) => {
                    const updated = [...config.aggregations];
                    updated[i].column = v;
                    updateConfig('aggregations', updated);
                  }}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Column" /></SelectTrigger>
                    <SelectContent>{columnNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={agg.function} onValueChange={(v) => {
                    const updated = [...config.aggregations];
                    updated[i].function = v;
                    updateConfig('aggregations', updated);
                  }}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="min">Min</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={agg.alias} onChange={(e) => {
                    const updated = [...config.aggregations];
                    updated[i].alias = e.target.value;
                    updateConfig('aggregations', updated);
                  }} placeholder="Output name" className="h-8" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'sample':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mode</Label>
              <Select value={config.sampleMode || 'first'} onValueChange={(v) => updateConfig('sampleMode', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">Take first N rows</SelectItem>
                  <SelectItem value="random">Random sample (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{config.sampleMode === 'first' ? 'Number of Rows' : 'Percentage'}</Label>
              <Input
                type="number"
                value={config.sampleValue || 100}
                onChange={(e) => updateConfig('sampleValue', e.target.value)}
                className="mt-1"
                placeholder={config.sampleMode === 'first' ? '100' : '10'}
              />
            </div>
          </div>
        );

      case 'exportDataset':
        return (
          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select value={config.format || 'csv'} onValueChange={(v) => updateConfig('format', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File Name</Label>
              <Input value={config.fileName || 'export'} onChange={(e) => updateConfig('fileName', e.target.value)} className="mt-1" placeholder="export" />
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">Configuration for {step.type} will be added soon</p>;
    }
  };

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm">Step Configuration</CardTitle>
        <Badge variant="outline" className="w-fit">{step.type}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-520px)]">
          <div className="p-4">
            <div className="mb-4">
              <Label>Step Name</Label>
              <Input
                value={step.label}
                onChange={(e) => onConfigUpdate({ ...config, _label: e.target.value })}
                className="mt-1"
                placeholder="Step name"
              />
            </div>
            {renderConfigForm()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
