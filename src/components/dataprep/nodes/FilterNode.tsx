import {
  memo,
  useState,
  useCallback,
  useEffect,
  ChangeEvent,
} from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Filter as FilterIcon, X, AlertCircle } from "lucide-react";

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty";

export type FilterLogic = "all" | "any";

export type FilterCondition = {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
};

export type FilterConfig = {
  enabled: boolean;
  logic: FilterLogic;
  conditions: FilterCondition[];
};

export type FilterDataset = {
  fileName?: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  rowCount?: number;
  columnCount?: number;
};

export type FilterNodeData = {
  dataset?: FilterDataset;

  // optional initial config (from saved scenario)
  config?: Partial<FilterConfig>;

  // called whenever filter changes + filtered dataset recalculated
  onFilterChange?: (nodeId: string, payload: {
    config: FilterConfig;
    input: FilterDataset;
    output: FilterDataset;
  }) => void;
};

// ---- helper functions ----

const createDefaultCondition = (column = ""): FilterCondition => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  column,
  operator: "contains",
  value: "",
});

const normalizeConfig = (
  partial: Partial<FilterConfig> | undefined,
  headers: string[]
): FilterConfig => {
  const firstColumn = headers[0] ?? "";
  const base: FilterConfig = {
    enabled: true,
    logic: "all",
    conditions: [createDefaultCondition(firstColumn)],
  };

  if (!partial) return base;

  return {
    enabled: partial.enabled ?? base.enabled,
    logic: partial.logic ?? base.logic,
    conditions:
      partial.conditions && partial.conditions.length > 0
        ? partial.conditions
        : base.conditions,
  };
};

const getCell = (
  row: (string | number | boolean | null)[],
  headers: string[],
  column: string
) => {
  const idx = headers.indexOf(column);
  if (idx === -1) return null;
  return row[idx] ?? null;
};

const evaluateCondition = (
  row: (string | number | boolean | null)[],
  headers: string[],
  cond: FilterCondition
): boolean => {
  const value = getCell(row, headers, cond.column);
  const op = cond.operator;
  const target = cond.value;

  if (op === "isEmpty") {
    return value === null || value === undefined || String(value).trim() === "";
  }

  if (op === "isNotEmpty") {
    return !(value === null || value === undefined || String(value).trim() === "");
  }

  const vStr = value == null ? "" : String(value);
  const tStr = target ?? "";

  // numeric comparison if possible
  const vNum = typeof value === "number" ? value : Number(vStr);
  const tNum = Number(tStr);
  const bothNumeric = !Number.isNaN(vNum) && !Number.isNaN(tNum);

  if (op === "eq") {
    return bothNumeric ? vNum === tNum : vStr === tStr;
  }
  if (op === "neq") {
    return bothNumeric ? vNum !== tNum : vStr !== tStr;
  }
  if (op === "gt") {
    return bothNumeric ? vNum > tNum : vStr > tStr;
  }
  if (op === "gte") {
    return bothNumeric ? vNum >= tNum : vStr >= tStr;
  }
  if (op === "lt") {
    return bothNumeric ? vNum < tNum : vStr < tNum;
  }
  if (op === "lte") {
    return bothNumeric ? vNum <= tNum : vStr <= tNum;
  }
  if (op === "contains") {
    return vStr.toLowerCase().includes(tStr.toLowerCase());
  }
  if (op === "startsWith") {
    return vStr.toLowerCase().startsWith(tStr.toLowerCase());
  }
  if (op === "endsWith") {
    return vStr.toLowerCase().endsWith(tStr.toLowerCase());
  }

  return true;
};

const applyFilter = (dataset: FilterDataset, config: FilterConfig): FilterDataset => {
  if (!config.enabled || config.conditions.length === 0) {
    return {
      ...dataset,
      rowCount: dataset.rows.length,
      columnCount: dataset.headers.length,
    };
  }

  const { headers, rows } = dataset;
  const conditions = config.conditions.filter((c) => c.column);

  if (conditions.length === 0) {
    return {
      ...dataset,
      rowCount: rows.length,
      columnCount: headers.length,
    };
  }

  const filteredRows = rows.filter((row) => {
    const results = conditions.map((cond) =>
      evaluateCondition(row, headers, cond)
    );
    return config.logic === "all"
      ? results.every(Boolean)
      : results.some(Boolean);
  });

  return {
    ...dataset,
    rows: filteredRows,
    rowCount: filteredRows.length,
    columnCount: headers.length,
  };
};

export const FilterNode = memo(({ id, data, selected }: NodeProps<FilterNodeData>) => {
  const dataset = data?.dataset;

  const hasDataset = !!dataset && dataset.headers?.length > 0;
  const headers = dataset?.headers ?? [];

  const [config, setConfig] = useState<FilterConfig>(() =>
    normalizeConfig(data?.config, headers)
  );
  const [filteredRowCount, setFilteredRowCount] = useState<number>(
    dataset?.rows?.length ?? 0
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // keep config synced with incoming headers (e.g., when new dataset arrives)
  useEffect(() => {
    if (!headers.length) return;
    setConfig((prev) => normalizeConfig(prev, headers));
  }, [headers.length]);

  // recompute filtered dataset whenever dataset or config changes
  useEffect(() => {
    if (!hasDataset || !dataset) return;

    const output = applyFilter(dataset, config);
    setFilteredRowCount(output.rows.length);

    data?.onFilterChange?.(id, {
      config,
      input: dataset,
      output,
    });

    const summary =
      config.enabled && config.conditions.length
        ? `${config.conditions.length} condition${
            config.conditions.length > 1 ? "s" : ""
          } (${config.logic === "all" ? "Match all" : "Match any"})`
        : "No filter active";
    setStatusMessage(summary);
  }, [config, dataset, hasDataset, data, id]);

  // ---- handlers ----

  const handleToggleEnabled = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const enabled = e.target.checked;
      setConfig((prev) => ({ ...prev, enabled }));
    },
    []
  );

  const handleLogicChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const logic = (e.target.value as FilterLogic) || "all";
    setConfig((prev) => ({ ...prev, logic }));
  }, []);

  const handleConditionColumnChange = useCallback(
    (idCond: string, column: string) => {
      setConfig((prev) => ({
        ...prev,
        conditions: prev.conditions.map((c) =>
          c.id === idCond ? { ...c, column } : c
        ),
      }));
    },
    []
  );

  const handleConditionOperatorChange = useCallback(
    (idCond: string, operator: FilterOperator) => {
      setConfig
