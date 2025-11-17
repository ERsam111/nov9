import { memo, useState, useCallback, useEffect, ChangeEvent } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

export type OutputFormat = "excel" | "csv" | "json";

export type OutputConfig = {
  format: OutputFormat;
  fileName: string;
};

export type OutputDataset = {
  fileName?: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  rowCount?: number;
  columnCount?: number;
};

export type OutputNodeData = {
  dataset?: OutputDataset;

  // optional config from parent (for saving/loading scenarios)
  config?: Partial<OutputConfig>;

  // notify parent if user changes config (format/filename)
  onConfigChange?: (nodeId: string, config: OutputConfig) => void;
};

const makeSafeBaseName = (name: string) => name.replace(/[<>:"/\\|?*]+/g, "_").trim() || "dataset";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const datasetToCsv = (headers: string[], rows: OutputDataset["rows"]) => {
  const headerLine = headers.join(",");
  const bodyLines = rows.map((row) =>
    headers
      .map((_, i) => {
        const v = row?.[i];
        let s = v == null ? "" : String(v);
        if (s.includes('"') || s.includes(",") || s.includes("\n")) {
          s = `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      })
      .join(","),
  );
  return [headerLine, ...bodyLines].join("\r\n");
};

const datasetToJson = (headers: string[], rows: OutputDataset["rows"]) => {
  const objects = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = row?.[i] ?? null;
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
};

const datasetToXlsxBlob = (sheetName: string, headers: string[], rows: OutputDataset["rows"]) => {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export const OutputNode = memo(({ id, data, selected }: NodeProps<OutputNodeData>) => {
  const dataset = data?.dataset;

  const inferredBaseName = dataset?.fileName?.replace(/\.[^.]+$/, "") || dataset?.sheetName || "dataset";

  const [format, setFormat] = useState<OutputFormat>((data?.config?.format as OutputFormat) || "excel");
  const [fileNameBase, setFileNameBase] = useState<string>(data?.config?.fileName || inferredBaseName);

  const [status, setStatus] = useState<"idle" | "exporting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasDataset = !!dataset && dataset.headers?.length > 0;

  const rowCount = dataset?.rowCount ?? dataset?.rows?.length ?? 0;
  const columnCount = dataset?.columnCount ?? dataset?.headers?.length ?? 0;

  // Keep base name in sync if dataset changes and user hasn't customized it
  useEffect(() => {
    if (!data?.config?.fileName && inferredBaseName && !fileNameBase) {
      setFileNameBase(inferredBaseName);
    }
  }, [data?.config?.fileName, inferredBaseName, fileNameBase]);

  // Emit config changes to parent if callback exists
  useEffect(() => {
    if (!data?.onConfigChange) return;
    const cfg: OutputConfig = {
      format,
      fileName: fileNameBase || inferredBaseName,
    };
    data.onConfigChange(id, cfg);
  }, [id, data, format, fileNameBase, inferredBaseName]);

  const handleFormatChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const newFormat = (e.target.value || "excel") as OutputFormat;
    setFormat(newFormat);
  }, []);

  const handleFileNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFileNameBase(e.target.value);
  }, []);

  const handleDownload = useCallback(() => {
    if (!hasDataset || !dataset) {
      setStatus("error");
      setStatusMessage("No data connected to this output node.");
      return;
    }

    try {
      setStatus("exporting");
      setStatusMessage(null);

      const safeBase = makeSafeBaseName(fileNameBase || inferredBaseName);
      if (format === "csv") {
        const csv = datasetToCsv(dataset.headers, dataset.rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${safeBase}.csv`);
      } else if (format === "json") {
        const json = datasetToJson(dataset.headers, dataset.rows);
        const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
        downloadBlob(blob, `${safeBase}.json`);
      } else {
        // excel
        const blob = datasetToXlsxBlob(dataset.sheetName || "Sheet1", dataset.headers, dataset.rows);
        downloadBlob(blob, `${safeBase}.xlsx`);
      }

      setStatus("success");
      setStatusMessage("Exported successfully.");
      // auto-reset to idle after a short moment
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Failed to generate file.");
    }
  }, [dataset, fileNameBase, format, hasDataset, inferredBaseName]);

  const formatLabel = format === "csv" ? "CSV" : format === "json" ? "JSON" : "Excel";

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md bg-card border-2 min-w-[210px]
      hover:shadow-lg transition-all group
      ${selected ? "border-primary" : "border-border"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
            <Download className="h-3 w-3 text-red-500" />
          </div>
          <div className="font-semibold text-xs">Output</div>
        </div>

        {status === "exporting" && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Exporting…</span>
        )}
        {status === "success" && (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        )}
        {status === "idle" && hasDataset && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Ready</span>
        )}
      </div>

      {/* Format + file name controls */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <span className="block text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Format</span>
            <select
              className="w-full rounded border bg-background text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={format}
              onChange={handleFormatChange}
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>
        </div>

        <div className="mt-1">
          <span className="block text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">File name</span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              className="flex-1 rounded border bg-background text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={fileNameBase}
              onChange={handleFileNameChange}
              placeholder="dataset_export"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">
              {format === "csv" ? ".csv" : format === "json" ? ".json" : ".xlsx"}
            </span>
          </div>
        </div>
      </div>

      {/* Summary line */}
      {(dataset?.fileName || dataset?.sheetName || rowCount || columnCount) && (
        <div className="mt-2 text-[9px] text-muted-foreground space-y-0.5">
          {(dataset?.fileName || dataset?.sheetName) && (
            <div className="truncate">
              {dataset?.fileName && (
                <>
                  File: <span className="font-medium">{dataset.fileName}</span>
                </>
              )}
              {dataset?.sheetName && (
                <>
                  {" "}
                  · Sheet: <span className="font-medium">{dataset.sheetName}</span>
                </>
              )}
            </div>
          )}
          {(rowCount || columnCount) && (
            <div>
              {rowCount || "?"} rows × {columnCount || "?"} columns
            </div>
          )}
        </div>
      )}

      {/* Status message */}
      {statusMessage && (
        <div className="mt-1 text-[9px] text-muted-foreground flex items-start gap-1">
          {status === "error" && <AlertCircle className="h-3 w-3 text-red-500 mt-[1px]" />}
          <span className={status === "error" ? "text-red-500" : "text-muted-foreground"}>{statusMessage}</span>
        </div>
      )}

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={!hasDataset || status === "exporting"}
        className={`mt-2 w-full inline-flex items-center justify-center gap-1 text-[10px] px-2 py-1 rounded 
          border bg-background transition-colors
          ${hasDataset && status !== "exporting" ? "hover:bg-muted cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
      >
        <Download className="h-3 w-3" />
        <span>Download {formatLabel}</span>
      </button>

      <Handle type="target" position={Position.Left} className="w-2 h-2" />
    </div>
  );
});

OutputNode.displayName = "OutputNode";
