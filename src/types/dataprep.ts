export type DataStepType =
  | "selectColumns" | "filterRows" | "sortRows" | "renameColumn"
  | "changeType" | "calculatedColumn" | "groupAggregate"
  | "removeDuplicates" | "fillMissing" | "splitColumn"
  | "mergeColumns" | "joinDatasets" | "unionDatasets"
  | "pivot" | "unpivot" | "sample" | "conditionalReplace"
  | "reorderColumns" | "dataProfile" | "exportDataset";

export interface DataStep {
  id: string;
  type: DataStepType;
  label: string;
  isActive: boolean;
  config: any;
  usedColumns: string[];
  order: number;
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'integer' | 'date' | 'datetime' | 'boolean';
  sampleValue?: any;
  nullCount?: number;
  distinctCount?: number;
  createdInStep?: string;
}

export interface DatasetPreview {
  columns: ColumnInfo[];
  rows: any[];
  totalRows: number;
}

export interface ActionWidget {
  type: DataStepType;
  name: string;
  icon: string;
  description: string;
  category: 'basic' | 'transform' | 'combine' | 'advanced' | 'export';
}
