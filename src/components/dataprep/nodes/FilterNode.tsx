import { memo, useState, useCallback, useEffect, ChangeEvent } from "react";
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
  // full dataset from previous node (ideal)
  dataset?: FilterDataset;

  // optional config (for saving scenarios)
  config?: Partial<FilterConfig>;

  // OPTIONAL: if you don’t have dataset, you can just pass columns:
  // headers?: string[];
  // columns?: string[];
  // availableColumns?: string[];

  // optional callback if you want filtered data back in parent
  onFilterChange?: (
    nodeId: string,
    payload: {
      config: FilterConfig;
      input: FilterDataset;
      output: FilterDataset;
    },
  ) => void;
};

// ---------- helpers ----------

const createDefaultCondition = (column = ""): FilterCondition => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  column,
  operator: "contains",
  value: "",
});

const normalizeConfig = (partial: Partial<FilterConfig> | undefined, headers: string[]): FilterConfig => {
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
    conditions: partial.conditions && partial.conditions.length > 0 ? partial.conditions : base.conditions,
  };
};

const getCell = (row: (string | number | boolean | null)[], headers: string[], column: string) => {
  const idx = headers.indexOf(column);
  if (idx === -1) return null;
  return row[idx] ?? null;
};

const evaluateCondition = (
  row: (string | number | boolean | null)[],
  headers: string[],
  cond: FilterCondition,
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

  const vNum = typeof value === "number" ? value : Number(vStr);
  const tNum = Number(tStr);
  const bothNumeric = !Number.isNaN(vNum) && !Number.isNaN(tNum);

  if (op === "eq") return bothNumeric ? vNum === tNum : vStr === tStr;
  if (op === "neq") return bothNumeric ? vNum !== tNum : vStr !== tStr;
  if (op === "gt") return bothNumeric ? vNum > tNum : vStr > tNum;
  if (op === "gte") return bothNumeric ? vNum >= tNum : vStr >= tNum;
  if (op === "lt") return bothNumeric ? vNum < tNum : vStr < tNum;
  if (op === "lte") return bothNumeric ? vNum <= tNum : vStr <= tNum;

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
    const results = conditions.map((cond) => evaluateCondition(row, headers, cond));
    return config.logic === "all" ? results.every(Boolean) : results.some(Boolean);
  });

  return {
    ...dataset,
    rows: filteredRows,
    rowCount: filteredRows.length,
    columnCount: headers.length,
  };
};

// ---------- node component ----------

export const FilterNode = memo(({ id, data, selected }: NodeProps<FilterNodeData>) => {
  // 1) Try columns from dataset.headers
  const dataset = data?.dataset;
  const datasetHeaders = dataset?.headers ?? [];

  // 2) Fallback: columns passed directly on data
  const manualHeaders: string[] =
    ((data as any)?.headers as string[] | undefined) ??
    ((data as any)?.columns as string[] | undefined) ??
    ((data as any)?.availableColumns as string[] | undefined) ??
    [];

  // 3) Final headers for UI
  const headers: string[] = datasetHeaders.length > 0 ? datasetHeaders : manualHeaders;

  const hasDataset = !!dataset && datasetHeaders.length > 0;

  // 🔍 helpful dev log so you can see what this node receives
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("FilterNode data for node", id, { data, headers, dataset });
  }, [id, data, headers.length]);

  const [config, setConfig] = useState<FilterConfig>(() => normalizeConfig(data?.config, headers));
  const [filteredRowCount, setFilteredRowCount] = useState<number>(dataset?.rows?.length ?? 0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // keep config in sync when headers change
  useEffect(() => {
    if (!headers.length) return;
    setConfig((prev) => normalizeConfig(prev, headers));
  }, [headers.length]);

  // recompute whenever dataset or config changes
  useEffect(() => {
    if (!hasDataset || !dataset) {
      const summary =
        config.enabled && config.conditions.length
          ? `${config.conditions.length} condition${
              config.conditions.length > 1 ? "s" : ""
            } (${config.logic === "all" ? "Match all" : "Match any"})`
          : "No filter active";
      setStatusMessage(summary);
      return;
    }

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

  const handleToggleEnabled = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const handleLogicChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const logic = (e.target.value as FilterLogic) || "all";
    setConfig((prev) => ({ ...prev, logic }));
  }, []);

  const handleConditionColumnChange = useCallback((condId: string, column: string) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.id === condId ? { ...c, column } : c)),
    }));
  }, []);

  const handleConditionOperatorChange = useCallback((condId: string, operator: FilterOperator) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.id === condId ? { ...c, operator } : c)),
    }));
  }, []);

  const handleConditionValueChange = useCallback((condId: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.id === condId ? { ...c, value } : c)),
    }));
  }, []);

  const handleAddCondition = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      conditions: [...prev.conditions, createDefaultCondition(headers[0] ?? "")],
    }));
  }, [headers]);

  const handleRemoveCondition = useCallback(
    (condId: string) => {
      setConfig((prev) => {
        const next = prev.conditions.filter((c) => c.id !== condId);
        return {
          ...prev,
          conditions: next.length ? next : [createDefaultCondition(headers[0] ?? "")],
        };
      });
    },
    [headers],
  );

  const inputRows = dataset?.rowCount ?? dataset?.rows?.length ?? 0;
  const inputCols = dataset?.columnCount ?? headers.length ?? 0;

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md bg-card border-2 min-w-[230px]
      hover:shadow-lg transition-all group
      ${selected ? "border-primary" : "border-border"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
            <FilterIcon className="h-3 w-3 text-orange-500" />
          </div>
          <div className="font-semibold text-xs">Filter</div>
        </div>

        <label className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <input type="checkbox" className="h-3 w-3" checked={config.enabled} onChange={handleToggleEnabled} />
          <span>{config.enabled ? "On" : "Off"}</span>
        </label>
      </div>

      {/* No columns at all */}
      {!headers.length && (
        <div className="mt-2 text-[10px] text-muted-foreground flex items-start gap-1">
          <AlertCircle className="h-3 w-3 text-yellow-500 mt-[2px]" />
          <span>
            No columns found. Pass <code className="mx-0.5">data.dataset.headers</code> or{" "}
            <code className="mx-0.5">data.headers</code> /<code className="mx-0.5">data.columns</code>.
          </span>
        </div>
      )}

      {/* Info when headers exist */}
      {headers.length > 0 && (
        <>
          <div className="mt-2 text-[9px] text-muted-foreground flex justify-between gap-2">
            <span>
              In: {inputRows} r × {inputCols} c
            </span>
            {hasDataset && <span>Out: {filteredRowCount} r</span>}
          </div>

          {/* Logic selector */}
          <div className="mt-2">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Logic</span>
            <select
              className="mt-0.5 w-full rounded border bg-background text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={config.logic}
              onChange={handleLogicChange}
              disabled={!config.enabled}
            >
              <option value="all">Match all conditions</option>
              <option value="any">Match any condition</option>
            </select>
          </div>

          {/* Conditions */}
          <div className="mt-2 space-y-1">
            {config.conditions.map((cond, idx) => {
              const operator = cond.operator;
              const usesValue = operator !== "isEmpty" && operator !== "isNotEmpty";

              return (
                <div
                  key={cond.id}
                  className={`border rounded px-1.5 py-1 flex flex-col gap-1 ${!config.enabled ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] text-muted-foreground">Condition {idx + 1}</span>
                    {config.conditions.length > 1 && (
                      <button
                        type="button"
                        className="text-[9px] text-muted-foreground hover:text-red-500 inline-flex items-center gap-0.5"
                        onClick={() => handleRemoveCondition(cond.id)}
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Column */}
                    <select
                      className="flex-1 rounded border bg-background text-[10px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={cond.column}
                      onChange={(e) => handleConditionColumnChange(cond.id, e.target.value)}
                      disabled={!config.enabled}
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      className="flex-[0.9] rounded border bg-background text-[10px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={operator}
                      onChange={(e) => handleConditionOperatorChange(cond.id, e.target.value as FilterOperator)}
                      disabled={!config.enabled}
                    >
                      <option value="eq">=</option>
                      <option value="neq">≠</option>
                      <option value="gt">&gt;</option>
                      <option value="gte">≥</option>
                      <option value="lt">&lt;</option>
                      <option value="lte">≤</option>
                      <option value="contains">contains</option>
                      <option value="startsWith">starts with</option>
                      <option value="endsWith">ends with</option>
                      <option value="isEmpty">is empty</option>
                      <option value="isNotEmpty">is not empty</option>
                    </select>
                  </div>

                  {/* Value input */}
                  {usesValue && (
                    <input
                      type="text"
                      className="mt-0.5 w-full rounded border bg-background text-[10px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Value…"
                      value={cond.value}
                      onChange={(e) => handleConditionValueChange(cond.id, e.target.value)}
                      disabled={!config.enabled}
                    />
                  )}
                </div>
              );
            })}

            {/* Add condition button */}
            <button
              type="button"
              onClick={handleAddCondition}
              disabled={!config.enabled}
              className={`mt-1 w-full text-[10px] px-2 py-1 rounded border bg-background transition-colors
                ${config.enabled ? "hover:bg-muted cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
            >
              + Add condition
            </button>
          </div>
        </>
      )}

      {/* Hover status line */}
      <div className="text-[10px] text-muted-foreground mt-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
        {statusMessage || "No filter"}
      </div>

      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

FilterNode.displayName = "FilterNode";
