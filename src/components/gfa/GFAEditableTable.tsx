import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, Plus, Trash2, MapPin, Edit2, RotateCcw, GripVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { TableColumnFilter, ColumnFilter, SortDirection, applyColumnFilter, applySorting } from "@/components/ui/table-column-filter";
interface GFAEditableTableProps {
  tableType: "customers" | "products" | "existing-sites";
  data: any[];
  onDataChange: (data: any[]) => void;
  onGeocode?: (index: number) => void;
  products?: any[]; // For customer table product dropdown
}
const getTableTitle = (type: string) => ({
  customers: "Customers",
  products: "Products",
  "existing-sites": "Existing Sites"
})[type] || type;
const getTableColumns = (tableType: string): string[] => {
  const map: Record<string, string[]> = {
    customers: ["Customer Name", "City", "Country", "Latitude", "Longitude", "Product", "Demand", "Unit of Measure"],
    products: ["Product Name", "Base Unit", "Selling Price", "to_m3", "to_ft3", "to_kg", "to_tonnes", "to_lbs", "to_liters", "to_pallets", "to_units", "to_sq2", "to_cbm"],
    "existing-sites": ["Site Name", "City", "Country", "Latitude", "Longitude", "Capacity", "Capacity Unit"]
  };
  return map[tableType] || ["Name"];
};

// Map display labels to actual Customer/Product type keys
const keyOf = (label: string, tableType: string) => {
  if (tableType === "customers") {
    const customerKeyMap: Record<string, string> = {
      "Customer Name": "name",
      "City": "city",
      "Country": "country",
      "Latitude": "latitude",
      "Longitude": "longitude",
      "Product": "product",
      "Demand": "demand",
      "Unit of Measure": "unitOfMeasure"
    };
    return customerKeyMap[label] || label.toLowerCase().replace(/[\s]+/g, "_");
  } else if (tableType === "products") {
    const productKeyMap: Record<string, string> = {
      "Product Name": "name",
      "Base Unit": "baseUnit",
      "Selling Price": "sellingPrice",
      "Unit Conversions": "unitConversions"
    };
    return productKeyMap[label] || label.toLowerCase().replace(/[\s]+/g, "_");
  } else if (tableType === "existing-sites") {
    const existingSiteKeyMap: Record<string, string> = {
      "Site Name": "name",
      "City": "city",
      "Country": "country",
      "Latitude": "latitude",
      "Longitude": "longitude",
      "Capacity": "capacity",
      "Capacity Unit": "capacityUnit"
    };
    return existingSiteKeyMap[label] || label.toLowerCase().replace(/[\s]+/g, "_");
  }
  return label.toLowerCase().replace(/[\s]+/g, "_");
};
export function GFAEditableTable({
  tableType,
  data,
  onDataChange,
  onGeocode,
  products = []
}: GFAEditableTableProps) {
  const [rows, setRows] = useState<any[]>(data);
  const columns = getTableColumns(tableType);
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
  
  const DEFAULT_COLUMN_WIDTH = 200;
  const WIDTH_PRESETS = {
    compact: 150,
    normal: 200,
    wide: 300
  };

  // Update column order when tableType changes
  useEffect(() => {
    setColumnOrder(getTableColumns(tableType));
  }, [tableType]);
  useEffect(() => {
    setRows(data);
    setSelectedRows(new Set());
  }, [data]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " && selectedColumn && !bulkEditOpen) {
        e.preventDefault();
        setBulkEditOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedColumn, bulkEditOpen]);
  const handleAddRow = () => {
    const newRow: any = {};
    if (tableType === "products") {
      newRow.name = "";
      newRow.baseUnit = "m3";
      newRow.sellingPrice = "";
      newRow.unitConversions = {};
    } else if (tableType === "customers") {
      newRow.id = `customer-${Date.now()}`;
      newRow.name = "";
      newRow.city = "";
      newRow.country = "";
      newRow.latitude = 0;
      newRow.longitude = 0;
      newRow.product = "";
      newRow.demand = 0;
      newRow.unitOfMeasure = "m3";
    } else if (tableType === "existing-sites") {
      newRow.id = `site-${Date.now()}`;
      newRow.name = "";
      newRow.city = "";
      newRow.country = "";
      newRow.latitude = 0;
      newRow.longitude = 0;
      newRow.capacity = 0;
      newRow.capacityUnit = "m3";
    }
    const updated = [...rows, newRow];
    setRows(updated);
    onDataChange(updated);
  };
  const handleDeleteRow = (i: number) => {
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    onDataChange(updated);
  };
  const handleChange = (i: number, col: string, val: any) => {
    const key = keyOf(col, tableType);
    
    // Use functional update to avoid race conditions with large datasets
    setRows(prevRows => {
      const updated = [...prevRows];
      
      // For product unit conversions, update the unitConversions object
      if (tableType === "products" && key.startsWith("to_")) {
        const conversions = { ...(updated[i].unitConversions || {}) };
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal > 0) {
          conversions[key] = numVal;
        } else {
          delete conversions[key];
        }
        updated[i] = {
          ...updated[i],
          unitConversions: conversions
        };
      } else {
        updated[i] = {
          ...updated[i],
          [key]: val
        };
      }
      
      // Call onDataChange in next tick to batch updates
      requestAnimationFrame(() => {
        onDataChange(updated);
      });
      
      return updated;
    });
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
    toast.success(`Deleted ${selectedRows.size} row(s)`);
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(rows.map((_, i) => i));
      setSelectedRows(allIndices);
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
    const key = keyOf(selectedColumn, tableType);
    const updated = [...rows];

    lines.forEach((value, index) => {
      if (index < updated.length) {
        if (tableType === "products" && key.startsWith("to_")) {
          updated[index] = {
            ...updated[index],
            unitConversions: {
              ...updated[index].unitConversions,
              [key]: value.trim()
            }
          };
        } else {
          updated[index] = { ...updated[index], [key]: value.trim() };
        }
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

    const key = keyOf(selectedColumn, tableType);
    const updated = rows.map(row => {
      if (tableType === "products" && key.startsWith("to_")) {
        return {
          ...row,
          unitConversions: {
            ...row.unitConversions,
            [key]: ""
          }
        };
      }
      return { ...row, [key]: "" };
    });

    setRows(updated);
    onDataChange(updated);
    setBulkEditOpen(false);
    setBulkEditValue("");
    setSelectedColumn(null);
    toast.success(`Cleared column "${selectedColumn}"`);
  };

  // Column resizing handlers
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[column] || 200;
    setResizingColumn({ column, startX, startWidth });
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizingColumn.startX;
      const newWidth = Math.max(100, resizingColumn.startWidth + delta);
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

  // Reset column widths to default
  const handleResetColumnWidths = () => {
    setColumnWidths({});
    toast.success("Column widths reset to default");
  };

  // Apply width preset to all columns
  const handleApplyWidthPreset = (preset: keyof typeof WIDTH_PRESETS) => {
    const newWidths: Record<string, number> = {};
    columnOrder.forEach(col => {
      newWidths[col] = WIDTH_PRESETS[preset];
    });
    setColumnWidths(newWidths);
    toast.success(`Applied ${preset} width preset`);
  };

  // Drag and drop column reordering
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
    if (!draggingColumn || draggingColumn === targetColumn) {
      setDraggingColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const dragIndex = newOrder.indexOf(draggingColumn);
    const dropIndex = newOrder.indexOf(targetColumn);
    
    newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggingColumn);
    
    setColumnOrder(newOrder);
    setDraggingColumn(null);
    setDragOverColumn(null);
    toast.success("Column reordered");
  };

  const handleDragEnd = () => {
    setDraggingColumn(null);
    setDragOverColumn(null);
  };
  
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const workbook = XLSX.read(evt.target?.result, {
          type: "binary"
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setRows(jsonData);
        onDataChange(jsonData);
        toast.success("Data imported successfully");
      } catch (error) {
        toast.error("Failed to import data");
      }
    };
    reader.readAsBinaryString(file);
  };
  const handleDownload = () => {
    const exportData = rows.length ? rows : [{}];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, getTableTitle(tableType));
    XLSX.writeFile(wb, `${tableType}_template.xlsx`);
  };
  const handleFilterChange = (columnKey: string, filter?: ColumnFilter) => {
    setColumnFilters((prev) => {
      const updated = { ...prev };
      if (filter) {
        updated[columnKey] = filter;
      } else {
        delete updated[columnKey];
      }
      return updated;
    });
  };

  const handleSortChange = (columnKey: string, sort: SortDirection) => {
    setColumnSorts({ [columnKey]: sort }); // Only one sort at a time
  };

  const getColumnDataType = (col: string): "text" | "number" => {
    const key = keyOf(col, tableType);
    const numericFields = ["latitude", "longitude", "demand", "sellingPrice"];
    return numericFields.includes(key) ? "number" : "text";
  };

  // Apply filters and sorting with useMemo to optimize large datasets
  const displayRows = useMemo(() => {
    let filtered = rows.filter((row) => {
      return Object.entries(columnFilters).every(([colLabel, filter]) => {
        const key = keyOf(colLabel, tableType);
        return applyColumnFilter(row[key], filter);
      });
    });

    // Apply sorting
    const sortEntry = Object.entries(columnSorts).find(([_, dir]) => dir !== null);
    if (sortEntry) {
      const [colLabel, direction] = sortEntry;
      const key = keyOf(colLabel, tableType);
      filtered = applySorting(filtered, key, direction);
    }
    
    return filtered;
  }, [rows, columnFilters, columnSorts, tableType]);
  
  // Pagination for large datasets
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 100; // Show 100 rows at a time
  const totalPages = Math.ceil(displayRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const start = currentPage * rowsPerPage;
    return displayRows.slice(start, start + rowsPerPage);
  }, [displayRows, currentPage, rowsPerPage]);

  return <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">{getTableTitle(tableType)}</h2>
            <span className="text-sm text-muted-foreground">
              {displayRows.length > rowsPerPage 
                ? `Showing ${currentPage * rowsPerPage + 1}-${Math.min((currentPage + 1) * rowsPerPage, displayRows.length)} of ${displayRows.length}`
                : `${displayRows.length} rows`}
            </span>
          </div>
          <div className="flex gap-2">
            {selectedRows.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete {selectedRows.size} Row(s)
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            {tableType === "customers" && <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" /> Import
                  <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleExcelUpload} />
                </label>
              </Button>}
            <Button size="sm" onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-2" /> Add Row
            </Button>
          </div>
        </div>

        {/* Column Width Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Column Width:</span>
          <Button variant="outline" size="sm" onClick={handleResetColumnWidths} className="h-7">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyWidthPreset('compact')} className="h-7">
            Compact
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyWidthPreset('normal')} className="h-7">
            Normal
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleApplyWidthPreset('wide')} className="h-7">
            Wide
          </Button>
          <span className="text-muted-foreground ml-2">
            <GripVertical className="h-3 w-3 inline mr-1" />
            Drag column headers to reorder
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="overflow-auto h-full">
          <div className="relative" style={{ paddingLeft: '144px' }}>
            <Table className="min-w-full relative">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 left-0 z-20 bg-background font-semibold text-sm w-16 px-3" style={{ marginLeft: '-144px' }}>
                    <Checkbox
                      checked={selectedRows.size === rows.length && rows.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="sticky top-0 left-16 z-20 bg-background border-r border-border font-semibold text-sm w-20 px-2 text-center" style={{ marginLeft: '-144px' }}>
                    Sr No
                  </TableHead>
                {columnOrder.map(c => (
                  <TableHead 
                    key={c}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c)}
                    onDragOver={(e) => handleDragOver(e, c)}
                    onDrop={(e) => handleDrop(e, c)}
                    onDragEnd={handleDragEnd}
                    className={`sticky top-0 z-10 bg-background border-r border-border font-semibold text-sm whitespace-nowrap px-2 cursor-move hover:bg-accent/50 ${
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
                    <div className="flex items-center justify-center gap-1">
                      <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="flex-1 text-center">
                              <TableColumnFilter
                                columnKey={keyOf(c, tableType)}
                                columnLabel={c}
                                dataType={getColumnDataType(c)}
                                currentFilter={columnFilters[c]}
                                currentSort={columnSorts[c] || null}
                                onFilterChange={(filter) => handleFilterChange(c, filter)}
                                onSortChange={(sort) => handleSortChange(c, sort)}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-primary text-primary-foreground z-50">
                            <p className="text-xs">Ctrl+Click to bulk edit • Drag to reorder</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary z-20"
                      onMouseDown={(e) => handleResizeStart(e, c)}
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => e.stopPropagation()}
                    />
                  </TableHead>
                ))}
                <TableHead className="sticky top-0 z-10 bg-background border-r border-border font-semibold text-sm whitespace-nowrap text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow>
                  <TableCell colSpan={columnOrder.length + 3} className="text-center text-muted-foreground py-8">
                    No data. Click "Add Row" to begin.
                  </TableCell>
                </TableRow> : displayRows.length === 0 ? <TableRow>
                  <TableCell colSpan={columnOrder.length + 3} className="text-center text-muted-foreground py-8">
                    No results match your filters.
                  </TableCell>
                </TableRow> : paginatedRows.map((row, displayIndex) => {
                const i = rows.indexOf(row);
                return <TableRow key={i} className={selectedRows.has(i) ? 'bg-primary/5' : 'bg-background'}>
                    <TableCell className={`sticky left-0 z-10 w-16 px-3 ${selectedRows.has(i) ? 'bg-primary/5' : 'bg-background'}`} style={{ marginLeft: '-144px' }}>
                      <Checkbox
                        checked={selectedRows.has(i)}
                        onCheckedChange={(checked) => handleRowSelection(i, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className={`sticky left-16 z-10 border-r border-border text-center text-sm text-muted-foreground w-20 ${selectedRows.has(i) ? 'bg-primary/5' : 'bg-background'}`} style={{ marginLeft: '-144px' }}>
                      {i + 1}
                    </TableCell>
                    {columnOrder.map(col => {
              const key = keyOf(col, tableType);
              const val = row[key] ?? "";
              const cellStyle = {
                width: columnWidths[col] || DEFAULT_COLUMN_WIDTH,
                minWidth: columnWidths[col] || DEFAULT_COLUMN_WIDTH,
                maxWidth: columnWidths[col] || DEFAULT_COLUMN_WIDTH
              };

              // Special handling for unit conversion columns in products
              if (tableType === "products" && key.startsWith("to_")) {
                const conversions = row.unitConversions || {};
                const value = conversions[key] || "";
                return <TableCell key={col} className="border-r border-border" style={cellStyle}>
                  <Input 
                    type="number"
                    value={value}
                    onChange={e => handleChange(i, col, e.target.value)}
                    placeholder="Factor"
                    className="h-9 text-sm w-24"
                  />
                </TableCell>;
              }

              // Special handling for base unit dropdown in products
              if (tableType === "products" && key === "baseUnit") {
                return <TableCell key={col} className="border-r border-border" style={cellStyle}>
                            <Select value={String(val)} onValueChange={v => handleChange(i, col, v)}>
                              <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background">
                                <SelectItem value="m3">m³ (Cubic Meter)</SelectItem>
                                <SelectItem value="pallets">Pallets</SelectItem>
                                <SelectItem value="kg">kg (Kilogram)</SelectItem>
                                <SelectItem value="tonnes">Tonnes</SelectItem>
                                <SelectItem value="lbs">lbs (Pounds)</SelectItem>
                                <SelectItem value="ft3">ft³ (Cubic Feet)</SelectItem>
                                <SelectItem value="liters">Liters</SelectItem>
                                <SelectItem value="units">Units</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>;
              }

              // Special handling for product dropdown in customers
              if (tableType === "customers" && key === "product") {
                return <TableCell key={col} className="border-r border-border" style={cellStyle}>
                            <Select value={String(val)} onValueChange={v => handleChange(i, col, v)}>
                              <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background">
                                {products.length > 0 ? (
                                  products.map((product) => (
                                    <SelectItem key={product.name} value={product.name}>
                                      {product.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" disabled>
                                    No products available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>;
              }

              // Special handling for country dropdown
              if (key === "country") {
                return <TableCell key={col} className="border-r border-border" style={cellStyle}>
                            <Select value={String(val)} onValueChange={v => handleChange(i, col, v)}>
                              <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background">
                                <SelectItem value="USA">USA</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="Mexico">Mexico</SelectItem>
                                <SelectItem value="UK">UK</SelectItem>
                                <SelectItem value="Germany">Germany</SelectItem>
                                <SelectItem value="France">France</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="China">China</SelectItem>
                                <SelectItem value="Japan">Japan</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>;
              }

              // Special handling for unit of measure dropdown in customers
              if (tableType === "customers" && key === "unitOfMeasure") {
                return <TableCell key={col} className="border-r border-border" style={cellStyle}>
                            <Select value={String(val)} onValueChange={v => handleChange(i, col, v)}>
                              <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background">
                                <SelectItem value="m3">m³ (Cubic Meter)</SelectItem>
                                <SelectItem value="pallets">Pallets</SelectItem>
                                <SelectItem value="kg">kg (Kilogram)</SelectItem>
                                <SelectItem value="tonnes">Tonnes</SelectItem>
                                <SelectItem value="lbs">lbs (Pounds)</SelectItem>
                                <SelectItem value="ft3">ft³ (Cubic Feet)</SelectItem>
                                <SelectItem value="liters">Liters</SelectItem>
                                <SelectItem value="units">Units</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>;
              }

              // Special handling for capacity unit dropdown in existing-sites
              if (tableType === "existing-sites" && key === "capacityUnit") {
                return <TableCell key={col} className="border-r border-border" style={cellStyle}>
                            <Select value={String(val)} onValueChange={v => handleChange(i, col, v)}>
                              <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent className="z-50 bg-background">
                                <SelectItem value="m3">m³ (Cubic Meter)</SelectItem>
                                <SelectItem value="pallets">Pallets</SelectItem>
                                <SelectItem value="kg">kg (Kilogram)</SelectItem>
                                <SelectItem value="tonnes">Tonnes</SelectItem>
                                <SelectItem value="lbs">lbs (Pounds)</SelectItem>
                                <SelectItem value="ft3">ft³ (Cubic Feet)</SelectItem>
                                <SelectItem value="liters">Liters</SelectItem>
                                <SelectItem value="units">Units</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>;
              }

              // Regular input fields
              return <TableCell key={col} className="whitespace-nowrap border-r border-border" style={cellStyle}>
                          <Input value={val === undefined || val === null ? "" : String(val)} onChange={e => handleChange(i, col, e.target.value)} placeholder={`Enter ${col}`} className="h-9 text-sm min-w-[120px]" type={key === "demand" || key === "sellingPrice" || key === "latitude" || key === "longitude" ? "number" : "text"} />
                        </TableCell>;
            })}
                    <TableCell className="border-r border-border">
                      <div className="flex items-center gap-1">
                        {tableType === "customers" && onGeocode && <Button variant="ghost" size="sm" onClick={() => onGeocode(i)} className="h-8 w-8 p-0">
                            <MapPin className="h-4 w-4 text-primary" />
                          </Button>}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRow(i)} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between shrink-0">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Bulk Edit: {selectedColumn}
            </DialogTitle>
            <DialogDescription>
              Enter one value per line to update the "<strong>{selectedColumn}</strong>" column. Each line corresponds to one row in the table.
              {rows.length > 0 && ` (Total rows: ${rows.length})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">Quick Tips:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Enter exactly {rows.length} lines to update all rows</li>
                <li>Leave a line blank to skip that row</li>
                <li>Click "Clear All" to remove all values from this column</li>
              </ul>
            </div>
            <Textarea
              value={bulkEditValue}
              onChange={(e) => setBulkEditValue(e.target.value)}
              placeholder={`Enter values for "${selectedColumn}", one per line...\nExample:\nValue for row 1\nValue for row 2\nValue for row 3`}
              className="min-h-[300px] font-mono text-sm"
              autoFocus
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {bulkEditValue.split("\n").filter(l => l.trim()).length} line(s) entered
              </span>
              {bulkEditValue.split("\n").filter(l => l.trim()).length > rows.length && (
                <span className="text-amber-600">⚠ More lines than rows!</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBulkEditOpen(false);
              setBulkEditValue("");
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearColumn}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button onClick={handleBulkEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>;
}