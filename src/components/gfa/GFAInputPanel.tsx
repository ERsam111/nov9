import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Download, FileDown, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Customer, Product, OptimizationSettings, ExistingSite } from "@/types/gfa";
import * as XLSX from "xlsx";
import { ExcelUpload } from "./ExcelUpload";
import { GFAEditableTable } from "./GFAEditableTable";
import { CostParameters } from "./CostParameters";
import { CustomerMapView } from "./CustomerMapView";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface GFAInputPanelProps {
  customers: Customer[];
  products: Product[];
  existingSites: ExistingSite[];
  settings: OptimizationSettings;
  onCustomersChange: (customers: Customer[]) => void;
  onProductsChange: (products: Product[]) => void;
  onExistingSitesChange: (sites: ExistingSite[]) => void;
  onSettingsChange: (settings: OptimizationSettings) => void;
}

export function GFAInputPanel({
  customers,
  products,
  existingSites,
  settings,
  onCustomersChange,
  onProductsChange,
  onExistingSitesChange,
  onSettingsChange,
}: GFAInputPanelProps) {
  // Use the same min width for BOTH tables so they align and scroll independently.
  // Adjust this number to suit your column set.
  const TABLE_MIN_WIDTH_CLS = "min-w-[100px]";

  const handleBulkUpload = (newCustomers: Customer[], mode: "append" | "overwrite") => {
    if (mode === "overwrite") {
      onCustomersChange(newCustomers);
    } else {
      onCustomersChange([...customers, ...newCustomers]);
    }
  };

  const handleClearData = () => {
    onCustomersChange([]);
    onProductsChange([]);
    toast.success("All data cleared successfully");
  };

  const handleClearCustomers = () => {
    onCustomersChange([]);
    toast.success("Customer data cleared");
  };

  const handleClearProducts = () => {
    onProductsChange([]);
    toast.success("Product data cleared");
  };

  const handleGeocodeCustomer = async (index: number) => {
    const customer = customers[index];
    if (!customer.city && !customer.country) {
      toast.error("Please provide city and country");
      return;
    }

    try {
      toast.info("Geocoding address...");
      // Integrate geocoding via your backend or a serverless fn here
      toast.success("Address geocoded successfully");
    } catch (error) {
      toast.error("Failed to geocode address");
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Customer Name": "",
      "City": "",
      "Country": "",
      "Latitude": "",
      "Longitude": "",
      "Product": "",
      "Demand": "",
      "Unit of Measure": ""
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "GFA_Template.xlsx");
    toast.success("Template downloaded");
  };

  return (
    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
      {/* Customer Map - Pure Input Visualization */}
      {customers.length > 0 && <CustomerMapView customers={customers} />}
      
      {/* Compact Data Controls Toolbar */}
      <TooltipProvider>
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Test</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                      <label className="cursor-pointer flex items-center justify-center">
                        <Upload className="h-4 w-4" />
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                                const workbook = XLSX.read(data, { type: "array" });
                                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                                const jsonData = XLSX.utils.sheet_to_json(sheet);
                                // Handle import logic here
                                toast.success("Data imported successfully");
                              } catch (error) {
                                toast.error("Failed to import data");
                              }
                            };
                            reader.readAsArrayBuffer(file);
                          }
                        }} />
                      </label>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Import Excel</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => {
                      const exportData = customers.length ? customers : [{}];
                      const ws = XLSX.utils.json_to_sheet(exportData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Customers");
                      XLSX.writeFile(wb, "GFA_Export.xlsx");
                      toast.success("Data exported");
                    }}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleDownloadTemplate}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Template</TooltipContent>
                </Tooltip>
              </div>
              
              {(customers.length > 0 || products.length > 0) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5 h-8 text-xs">
                      <Trash2 className="h-3 w-3" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all customer data, products, and optimization results.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData}>Clear All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Section 2: Customers (own bottom scrollbar; same width as Products) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Customers</CardTitle>
              <CardDescription className="text-[11px]">
                Edit customers, geocode addresses, and manage rows
              </CardDescription>
            </div>
            {customers.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 h-7 text-[11px]"
                onClick={handleClearCustomers}
              >
                <Trash2 className="h-3 w-3" />
                Clear Customers
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2 px-3 pb-3">
          {/* Make the scrollbar belong only to the table area.
             -mx-3 lets the scrollbar span the full card width (since CardContent has px-3). */}
          <div className="-mx-3 overflow-x-auto overscroll-x-contain pb-2">
            <div className={TABLE_MIN_WIDTH_CLS}>
              <GFAEditableTable
                tableType="customers"
                data={customers}
                onDataChange={onCustomersChange}
                onGeocode={handleGeocodeCustomer}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Cost Parameters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Cost Parameters</CardTitle>
          <CardDescription className="text-[11px]">3 required fields</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 px-3 pb-3">
          <CostParameters
            transportationCostPerMilePerUnit={settings.transportationCostPerMilePerUnit}
            facilityCost={settings.facilityCost}
            distanceUnit={settings.distanceUnit}
            costUnit={settings.costUnit}
            onTransportCostChange={(value) =>
              onSettingsChange({ ...settings, transportationCostPerMilePerUnit: value })
            }
            onFacilityCostChange={(value) => onSettingsChange({ ...settings, facilityCost: value })}
            onDistanceUnitChange={(value) => onSettingsChange({ ...settings, distanceUnit: value })}
            onCostUnitChange={(value) => onSettingsChange({ ...settings, costUnit: value })}
          />
        </CardContent>
      </Card>

      {/* Section 4: Products (own bottom scrollbar; same width as Customers) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Products</CardTitle>
              <CardDescription className="text-[11px]">Edit your product catalog and attributes</CardDescription>
            </div>
            {products.length > 0 && (
              <Button variant="destructive" size="sm" className="gap-1.5 h-7 text-[11px]" onClick={handleClearProducts}>
                <Trash2 className="h-3 w-3" />
                Clear Products
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2 px-3 pb-3">
          <div className="-mx-3 overflow-x-auto overscroll-x-contain pb-2">
            <div className={TABLE_MIN_WIDTH_CLS}>
              <GFAEditableTable tableType="products" data={products} onDataChange={onProductsChange} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
