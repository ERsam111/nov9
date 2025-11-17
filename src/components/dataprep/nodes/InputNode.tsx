import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { FileSpreadsheet } from "lucide-react";

type InputNodeData = {
  fileName?: string;
  sheets?: string[];
  selectedSheet?: string;
  onSelectSheet?: (sheetName: string) => void;
  onUploadClick?: () => void;
  rowCount?: number;
  columnCount?: number;
};

export const InputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as InputNodeData;

  const hasFile = !!nodeData.fileName;
  const sheets = nodeData.sheets ?? [];
  const hasSheets = hasFile && sheets.length > 0;
  const selectedSheet = nodeData.selectedSheet;

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-md bg-card border-2 min-w-[190px]
      hover:shadow-lg transition-all group
      ${selected ? "border-primary" : "border-border"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
            <FileSpreadsheet className="h-3 w-3 text-blue-500" />
          </div>
          <div className="font-semibold text-xs">Workbook Input</div>
        </div>

        {hasFile && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Ready</span>
        )}
      </div>

      {/* File selector / status */}
      <div className="mt-2 space-y-1">
        <button
          type="button"
          onClick={nodeData.onUploadClick}
          disabled={!nodeData.onUploadClick}
          className={`w-full text-left text-[10px] px-2 py-1 rounded border 
            bg-background truncate transition-colors
            ${nodeData.onUploadClick ? "hover:bg-muted cursor-pointer" : "cursor-default"}`}
          title={nodeData.fileName || "Select a workbook file"}
        >
          <span className="block text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">Workbook</span>
          <span className="font-medium">{nodeData.fileName || "Click to select file"}</span>
        </button>

        {/* Sheet select */}
        {hasSheets && (
          <div className="mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Sheet</span>
            </div>
            <select
              className="mt-0.5 w-full rounded border bg-background text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              value={selectedSheet || ""}
              onChange={(e) => nodeData.onSelectSheet?.(e.target.value)}
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

        {hasFile && !hasSheets && <p className="mt-1 text-[10px] text-muted-foreground italic">No sheets loaded yet</p>}
      </div>

      {/* Summary line */}
      {(selectedSheet || nodeData.rowCount || nodeData.columnCount) && (
        <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground gap-2">
          {selectedSheet && (
            <span className="truncate">
              Sheet: <span className="font-medium">{selectedSheet}</span>
            </span>
          )}
          {(nodeData.rowCount || nodeData.columnCount) && (
            <span className="shrink-0">
              {nodeData.rowCount ?? "?"} r × {nodeData.columnCount ?? "?"} c
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
});

InputNode.displayName = "InputNode";
