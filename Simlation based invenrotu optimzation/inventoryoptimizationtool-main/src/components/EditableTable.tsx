import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Maximize, Minimize, GripVertical, Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ParameterSetupDialog } from "./ParameterSetupDialog";
import { DistributionParameterDialog } from "./DistributionParameterDialog";
import { BOMDialog } from "./BOMDialog";
import { TableColumnFilter, ColumnFilter, SortDirection, applyColumnFilter, applySorting } from "@/components/ui/table-column-filter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EditableTableProps {
  title: string;
  description?: string;
  columns: string[];
  data: any[];
  onDataChange: (newData: any[]) => void;
  dropdownOptions?: Record<string, string[]>;
  inventoryPolicyData?: any[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const EditableTable = ({
  title,
  description,
  columns,
  data,
  onDataChange,
  dropdownOptions,
  inventoryPolicyData,
  isFullscreen = false,
  onToggleFullscreen,
}: EditableTableProps) => {
  const [rows, setRows] = useState<any[]>(data);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [columnSorts, setColumnSorts] = useState<Record<string, SortDirection>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<{ column: string; startX: number; startWidth: number } | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(columns);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [rowDensity, setRowDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [showWidthControls, setShowWidthControls] = useState(false);
  const [showDensityControls, setShowDensityControls] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const DEFAULT_COLUMN_WIDTH = 180;
  const WIDTH_PRESETS = {
    compact: 120,
    normal: 180,
    wide: 250
  };

  const ROW_DENSITY_STYLES = {
    compact: 'h-8 py-1 text-xs',
    comfortable: 'h-10 py-2 text-sm',
    spacious: 'h-12 py-3 text-base'
  };

  // Update rows when data changes
  useEffect(() => {
    setRows(data);
    setSelectedRows(new Set());
  }, [data]);

  // Update column order when columns change
  useEffect(() => {
    setColumnOrder(columns);
  }, [columns]);

  // Auto-populate Simulation Policy
  useEffect(() => {
    if (inventoryPolicyData && rows.length > 0 && columns.includes("Simulation Policy")) {
      const updatedData = rows.map((row) => {
        const facilityName = row["Facility Name"];
        const productName = row["Product"];

        if (facilityName && productName) {
          const policy = inventoryPolicyData.find(
            (p: any) => p["Facility Name"] === facilityName && p["Product Name"] === productName,
          );
          if (policy?.["Simulation Policy"]) {
            return { ...row, "Simulation Policy": policy["Simulation Policy"] };
          }
        }
        return row;
      });
      if (JSON.stringify(updatedData) !== JSON.stringify(rows)) {
        setRows(updatedData);
        onDataChange(updatedData);
      }
    }
  }, [rows, inventoryPolicyData]);

  // Apply filters and sorts
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Apply global search
    if (globalSearch.trim()) {
      result = result.filter(row => 
        columnOrder.some(col => {
          const value = row[col];
          return value?.toString().toLowerCase().includes(globalSearch.toLowerCase());
        })
      );
    }

    return result;
  }, [rows, columnOrder, globalSearch]);

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;
    setResizingColumn({ column, startX, startWidth });
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizingColumn.startX;
      const newWidth = Math.max(80, resizingColumn.startWidth + delta);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn.column]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn]);

  // Drag and drop for column reordering
  const handleDragStart = (e: React.DragEvent, column: string) => {
    setDraggingColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    if (draggingColumn && draggingColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (draggingColumn && draggingColumn !== targetColumn) {
      const newOrder = [...columnOrder];
      const dragIndex = newOrder.indexOf(draggingColumn);
      const dropIndex = newOrder.indexOf(targetColumn);
      
      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggingColumn);
      
      setColumnOrder(newOrder);
      toast("Column reordered successfully");
    }
    setDraggingColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggingColumn(null);
    setDragOverColumn(null);
  };

  const handleAddRow = () => {
    const newRow: any = {};
    columns.forEach((col) => (newRow[col] = col === "Parameter Setup" ? JSON.stringify([]) : ""));
    const updated = [...rows, newRow];
    setRows(updated);
    onDataChange(updated);
    toast("Row added");
  };

  const handleDeleteRow = (rowIndex: number) => {
    const updated = rows.filter((_, i) => i !== rowIndex);
    setRows(updated);
    onDataChange(updated);
    toast("Row deleted");
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      toast.error("No rows selected");
      return;
    }
    const updated = rows.filter((_, i) => !selectedRows.has(i));
    setRows(updated);
    setSelectedRows(new Set());
    onDataChange(updated);
    toast(`Deleted ${selectedRows.size} row(s)`);
  };

  const handleRowSelection = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: any) => {
    if (checked) {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleColumnClick = (columnLabel: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedColumn(columnLabel);
      setBulkEditOpen(true);
      toast.info(`Opening bulk editor for "${columnLabel}"`);
    }
  };

  const handleBulkEdit = () => {
    if (!selectedColumn || !bulkEditValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    const lines = bulkEditValue.split("\n").filter(line => line.trim());
    const updated = [...rows];

    lines.forEach((value, index) => {
      if (index < updated.length) {
        updated[index] = { ...updated[index], [selectedColumn]: value.trim() };
      }
    });

    setRows(updated);
    onDataChange(updated);
    setBulkEditOpen(false);
    setBulkEditValue("");
    setSelectedColumn(null);
    toast.success(`Updated ${lines.length} row(s) in column "${selectedColumn}"`);
  };

  const handleClearColumn = () => {
    if (!selectedColumn) return;

    const updated = rows.map(row => ({ ...row, [selectedColumn]: "" }));

    setRows(updated);
    onDataChange(updated);
    setBulkEditOpen(false);
    setBulkEditValue("");
    setSelectedColumn(null);
    toast.success(`Cleared column "${selectedColumn}"`);
  };

  const handleCellClick = (rowIndex: number, column: string, value: any) => {
    setEditingCell({ row: rowIndex, col: column });
    setEditValue(value?.toString() || "");
  };

  const handleCellSave = () => {
    if (editingCell) {
      const newData = [...rows];
      newData[editingCell.row][editingCell.col] = editValue;
      setRows(newData);
      onDataChange(newData);
      setEditingCell(null);
      toast.success("Cell updated");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCellSave();
    else if (e.key === "Escape") setEditingCell(null);
  };

  const applyWidthPreset = (preset: keyof typeof WIDTH_PRESETS) => {
    const newWidths: Record<string, number> = {};
    columnOrder.forEach(col => {
      newWidths[col] = WIDTH_PRESETS[preset];
    });
    setColumnWidths(newWidths);
    toast.success(`Applied ${preset} width preset`);
  };

  return (
    <TooltipProvider>
      <Card className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-2 border-b flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-sm font-semibold truncate">{title}</h2>
            <span className="text-xs text-muted-foreground">
              ({filteredAndSortedRows.length} rows)
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="h-8 w-40 pl-7 text-xs"
              />
            </div>

            {/* Width Controls */}
            <div className="relative">
              <Button 
                onClick={() => setShowWidthControls(!showWidthControls)} 
                size="sm" 
                variant="ghost"
                className="h-8 px-2"
              >
                <SlidersHorizontal className="h-3 w-3" />
              </Button>
              {showWidthControls && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md p-2 space-y-1">
                  <Button onClick={() => applyWidthPreset('compact')} size="sm" variant="ghost" className="w-full justify-start text-xs">
                    Compact
                  </Button>
                  <Button onClick={() => applyWidthPreset('normal')} size="sm" variant="ghost" className="w-full justify-start text-xs">
                    Normal
                  </Button>
                  <Button onClick={() => applyWidthPreset('wide')} size="sm" variant="ghost" className="w-full justify-start text-xs">
                    Wide
                  </Button>
                </div>
              )}
            </div>

            {/* Row Density */}
            <div className="relative">
              <Button 
                onClick={() => setShowDensityControls(!showDensityControls)} 
                size="sm" 
                variant="ghost"
                className="h-8 px-2"
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
              {showDensityControls && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md p-2 space-y-1">
                  <Button onClick={() => setRowDensity('compact')} size="sm" variant="ghost" className="w-full justify-start text-xs">
                    Compact
                  </Button>
                  <Button onClick={() => setRowDensity('comfortable')} size="sm" variant="ghost" className="w-full justify-start text-xs">
                    Comfortable
                  </Button>
                  <Button onClick={() => setRowDensity('spacious')} size="sm" variant="ghost" className="w-full justify-start text-xs">
                    Spacious
                  </Button>
                </div>
              )}
            </div>

            {/* Bulk Delete */}
            {selectedRows.size > 0 && (
              <Button onClick={handleBulkDelete} size="sm" variant="destructive" className="h-8">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete ({selectedRows.size})
              </Button>
            )}

            {/* Fullscreen Toggle */}
            {onToggleFullscreen && (
              <Button onClick={onToggleFullscreen} size="sm" variant="ghost" className="h-8 px-2">
                {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
              </Button>
            )}

            {/* Add Row */}
            <Button onClick={handleAddRow} size="sm" className="h-8">
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto relative">
          <div className="w-full h-full overflow-auto">
            <Table className="min-w-full relative" style={{ paddingLeft: '112px' }}>
              <TableHeader className="sticky top-0 z-30 bg-background shadow-sm">
                <TableRow className="bg-background">
                  {/* Checkbox Column */}
                  <TableHead 
                    className="sticky top-0 z-30 bg-background text-center border-r border-border shadow-sm"
                    style={{ left: 0, width: '48px', minWidth: '48px', maxWidth: '48px' }}
                  >
                    <Checkbox
                      checked={selectedRows.size === rows.length && rows.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>

                  {/* Sr No Column */}
                  <TableHead 
                    className="sticky top-0 z-30 bg-background border-r border-border text-center shadow-sm text-xs"
                    style={{ left: '48px', width: '64px', minWidth: '64px', maxWidth: '64px' }}
                  >
                    Sr No
                  </TableHead>

                  {/* Data Columns */}
                  {columnOrder.map((c) => (
                    <TableHead
                      key={c}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c)}
                      onDragOver={(e) => handleDragOver(e, c)}
                      onDrop={(e) => handleDrop(e, c)}
                      onDragEnd={handleDragEnd}
                      className={`sticky top-0 z-30 bg-background border-r border-border whitespace-nowrap px-2 cursor-move hover:bg-accent/50 shadow-sm text-xs ${
                        selectedColumn === c ? 'bg-primary/20' : ''
                      } ${draggingColumn === c ? 'opacity-50' : ''} ${dragOverColumn === c ? 'bg-accent' : ''}`}
                      onClick={(e) => handleColumnClick(c, e)}
                      style={{ 
                        width: columnWidths[c] || DEFAULT_COLUMN_WIDTH,
                        minWidth: columnWidths[c] || DEFAULT_COLUMN_WIDTH,
                        maxWidth: columnWidths[c] || DEFAULT_COLUMN_WIDTH,
                        position: 'relative'
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 relative">
                        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">{c}</span>
                        <div className="flex items-center gap-1">
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary"
                            onMouseDown={(e) => handleResizeStart(e, c)}
                          />
                        </div>
                      </div>
                    </TableHead>
                  ))}

                  {/* Actions Column */}
                  <TableHead className="sticky top-0 z-30 bg-background border-r border-border text-center shadow-sm text-xs">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAndSortedRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className={`hover:bg-accent/20 ${ROW_DENSITY_STYLES[rowDensity]}`}>
                    {/* Checkbox Cell */}
                    <TableCell 
                      className="sticky bg-background border-r border-border text-center"
                      style={{ left: 0, width: '48px', minWidth: '48px', maxWidth: '48px' }}
                    >
                      <Checkbox
                        checked={selectedRows.has(rowIndex)}
                        onCheckedChange={(checked) => handleRowSelection(rowIndex, checked as boolean)}
                      />
                    </TableCell>

                    {/* Sr No Cell */}
                    <TableCell 
                      className="sticky bg-background border-r border-border text-center font-mono"
                      style={{ left: '48px', width: '64px', minWidth: '64px', maxWidth: '64px' }}
                    >
                      {rowIndex + 1}
                    </TableCell>

                    {/* Data Cells */}
                    {columnOrder.map((column) => {
                      const cellValue = row[column];
                      const isEditing = editingCell?.row === rowIndex && editingCell?.col === column;
                      const isParameterSetup = column === "Parameter Setup";
                      const isDistributionParam = ["Demand Model", "Lead Time Model"].includes(column);
                      const isBOM = column === "BOM ID";

                      return (
                        <TableCell
                          key={column}
                          className="border-r border-border px-2 truncate"
                          style={{ 
                            width: columnWidths[column] || DEFAULT_COLUMN_WIDTH,
                            minWidth: columnWidths[column] || DEFAULT_COLUMN_WIDTH,
                            maxWidth: columnWidths[column] || DEFAULT_COLUMN_WIDTH
                          }}
                        >
                          {isEditing ? (
                            dropdownOptions?.[column] ? (
                              <Select value={editValue} onValueChange={(val) => {
                                setEditValue(val);
                                setTimeout(handleCellSave, 0);
                              }}>
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {dropdownOptions[column].map((opt) => (
                                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleCellSave}
                                className="h-7 text-xs"
                              />
                            )
                          ) : isParameterSetup ? (
                            <span className="text-xs text-muted-foreground">Setup</span>
                          ) : isDistributionParam ? (
                            <span className="text-xs text-muted-foreground">Model</span>
                          ) : isBOM ? (
                            <span className="text-xs text-muted-foreground">BOM</span>
                          ) : (
                            <div
                              onClick={() => handleCellClick(rowIndex, column, cellValue)}
                              className="cursor-pointer truncate"
                            >
                              {cellValue?.toString() || "—"}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}

                    {/* Actions Cell */}
                    <TableCell className="border-r border-border text-center">
                      <Button
                        onClick={() => handleDeleteRow(rowIndex)}
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Bulk Edit Dialog */}
        <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit: {selectedColumn}</DialogTitle>
              <DialogDescription>
                Enter one value per line. Each line will update the corresponding row.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={bulkEditValue}
              onChange={(e) => setBulkEditValue(e.target.value)}
              placeholder="Value 1&#10;Value 2&#10;Value 3"
              className="min-h-[200px] font-mono text-xs"
            />
            <DialogFooter className="gap-2">
              <Button onClick={handleClearColumn} variant="outline">
                Clear Column
              </Button>
              <Button onClick={() => setBulkEditOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleBulkEdit}>
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
};