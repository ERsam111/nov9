import { memo, useCallback, useRef, useState, useEffect, ChangeEvent } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";

export type InputNodeDataset = {
  fileName: string;
  sheetName: string;
  sheets: string[];
  headers: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  columnCount: number;
};

export type InputNodeData = {
  /** Optional initial state when loading from a saved scenario */
  fileName?: string;
  sheets?: string[];
  selectedSheet?: string;
  rowCount?: number;
  columnCount?: number;

  /** Advanced: full dataset callback so parent can update React Flow nodes */
  onDatasetChange?: (nodeId: string, dataset: InputNodeDataset) => void;

  /** Backwards-compatible callbacks if you were already using these */
  onSelectSheet?: (sheetName: string) => void;
  onUploadClick?: () => void;
};

export const InputNode = memo(({ id, data, selected }: NodeProps<InputNodeData>) => {
  const nodeData = data ?? {};

  // ---- internal state ----
  const [fileName, setFileName] = useState<string>(nodeData.fileName ?? "");
  const [sheets, setSheets] = useState<string[]>(nodeData.sheets ?? []);
  const [selectedSheet, setSelectedSheet] = useState<string>(nodeData.selectedSheet ?? "");
  const [rowCount, setRowCount] = useState<number>(nodeData.rowCount ?? 0);
  const [columnCount, setColumnCount] = useState<number>(nodeData.columnCount ?? 0);

  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<(string | number | boolean | null)[][]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workbookBufferRef = useRef<ArrayBuffer | null>(null);

  const hasFile = !!fileName;
  const hasSheets = hasFile && sheets.length > 0;

  // keep internal state in sync if parent passes new initial values later
  useEffect(() => {
    if (nodeData.fileName && nodeData.fileName !== fileName) {
      setFileName(nodeData.fileName);
    }
  }, [nodeData.fileName, fileName]);

  useEffect(() => {
    if (nodeData.selectedSheet && nodeData.selectedSheet !== selectedSheet) {
      setSelectedSheet(nodeData.selectedSheet);
    }
  }, [nodeData.selectedSheet, selectedSheet]);

  // ---- helpers ----
  const emitDatasetChange = useCallback(
    (dataset: InputNodeDataset) => {
      nodeData.onDatasetChange?.(id, dataset);
    },
    [id, nodeData],
  );

  const parseSheet = useCallback(
    (buffer: ArrayBuffer, targetSheetName: string, allSheets: string[], fileNameLocal: string) => {
      try {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[targetSheetName];
        if (!sheet) {
          throw new Error(`Sheet "${targetSheetName}" not found in workbook`);
        }

        const raw = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        }) as (string | number | boolean | null)[][];

        const [headerRow = [], ...bodyRows] = raw;
        const parsedHeaders = headerRow.map((h) => String(h ?? ""));
        const rows = bodyRows;

        const rc = rows.length;
        const cc = parsedHeaders.length;

        setHeaders(parsedHeaders);
        setPreviewRows(rows.slice(0, 5)); // preview first 5 rows
        setRowCount(rc);
        setColumnCount(cc);
        setSelectedSheet(targetSheetName);
        setStatus("idle");
        setErrorMessage(null);

        emitDatasetChange({
          fileName: fileNameLocal,
          sheetName: targetSheetName,
          sheets: allSheets,
          headers: parsedHeaders,
          rows,
          rowCount: rc,
          columnCount: cc,
        });
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to read sheet");
      }
    },
    [emitDatasetChange],
  );

  // ---- event handlers ----
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setStatus("loading");
      setErrorMessage(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result;
        if (!result || !(result instanceof ArrayBuffer)) {
          setStatus("error");
          setErrorMessage("Unable to read file contents");
          return;
        }

        workbookBufferRef.current = result;
        const fileNameLocal = file.name;
        setFileName(fileNameLocal);

        try {
          const workbook = XLSX.read(result, { type: "array" });
          const sheetNames = workbook.SheetNames ?? [];
          setSheets(sheetNames);

          if (sheetNames.length === 0) {
            setStatus("idle");
            setSelectedSheet("");
            setRowCount(0);
            setColumnCount(0);
            setHeaders([]);
            setPreviewRows([]);
            return;
          }

          // default to first sheet
          const firstSheet = sheetNames[0];
          parseSheet(result, firstSheet, sheetNames, fileNameLocal);
        } catch (err) {
          console.error(err);
          setStatus("error");
          setErrorMessage("Invalid workbook format");
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [parseSheet],
  );

  const handleUploadClick = useCallback(() => {
    // keep backwards compatibility: call parent callback if it exists
    nodeData.onUploadClick?.();
    fileInputRef.current?.click();
  }, [nodeData]);

  const handleSheetChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const sheetName = e.target.value;

      // Allow parent to react if it was using this callback already
      nodeData.onSelectSheet?.(sheetName);

      if (!workbookBufferRef.current || !fileName) {
        setSelectedSheet(sheetName);
        return;
      }

      setStatus("loading");
      setErrorMessage(null);
      parseSheet(workbookBufferRef.current, sheetName, sheets, fileName);
    },
    [nodeData, fileName, parseSheet, sheets],
  );

  const effectiveRowCount = rowCount || nodeData.rowCount || 0;
  const effectiveColumnCount = columnCount || nodeData.columnCount || 0;

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md bg-card border-2 min-w-[210px]
      hover:shadow-lg transition-all group
      ${selected ? "border-primary" : "border-border"}`}
    >
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
            <FileSpreadsheet className="h-3 w-3 text-blue-500" />
          </div>
          <div className="font-semibold text-xs">Workbook Input</div>
        </div>

        {status === "loading" && (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading
          </span>
        )}

        {status === "error" && (
          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        )}

        {status === "idle" && hasFile && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Ready</span>
        )}
      </div>

      {/* File selector / status */}
      <div className="mt-2 space-y-1">
        <button
          type="button"
          onClick={handleUploadClick}
          className={`w-full text-left text-[10px] px-2 py-1 rounded border 
            bg-background truncate transition-colors
            hover:bg-muted cursor-pointer`}
          title={fileName || "Select a workbook file"}
        >
          <span className="block text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Workbook</span>
          <span className="font-medium">{fileName || "Click to select file"}</span>
        </button>

        {/* Sheet select */}
        {hasSheets && (
          <div className="mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Sheet</span>
              {sheets.length > 1 && <span className="text-[9px] text-muted-foreground">{sheets.length} sheets</span>}
            </div>
            <select
              className="mt-0.5 w-full rounded border bg-background text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedSheet || ""}
              onChange={handleSheetChange}
            >
              <option value="" disabled>
                Select sheet
              </option>
              {sheets.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFile && !hasSheets && status !== "loading" && (
          <p className="mt-1 text-[10px] text-muted-foreground italic">No sheets found in workbook</p>
        )}

        {status === "error" && errorMessage && (
          <p className="mt-1 text-[9px] text-red-500 flex items-start gap-1">
            <AlertCircle className="h-3 w-3 mt-[1px]" />
            <span className="line-clamp-2">{errorMessage}</span>
          </p>
        )}
      </div>

      {/* Summary line */}
      {(selectedSheet || effectiveRowCount || effectiveColumnCount) && (
        <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground gap-2">
          {selectedSheet && (
            <span className="truncate">
              Sheet: <span className="font-medium">{selectedSheet}</span>
            </span>
          )}
          {(effectiveRowCount || effectiveColumnCount) && (
            <span className="shrink-0">
              {effectiveRowCount || "?"} r × {effectiveColumnCount || "?"} c
            </span>
          )}
        </div>
      )}

      {/* Tiny header preview */}
      {headers.length > 0 && (
        <div className="mt-2 border-t border-border pt-1">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">
            Columns (first {Math.min(headers.length, 4)})
          </div>
          <div className="flex flex-wrap gap-1">
            {headers.slice(0, 4).map((h) => (
              <span
                key={h}
                className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-foreground max-w-[90px] truncate"
                title={h}
              >
                {h}
              </span>
            ))}
            {headers.length > 4 && <span className="text-[9px] text-muted-foreground">+{headers.length - 4} more</span>}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

InputNode.displayName = "InputNode";
