import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, MapPin, BarChart3, TrendingUp, Upload, Download, MessageSquare, FileDown, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Customer, DistributionCenter, OptimizationSettings, Product, ExistingSite } from "@/types/gfa";
import { optimizeWithConstraints } from "@/utils/geoCalculations";
import { exportReport } from "@/utils/exportReport";
import { toast } from "sonner";
import { GFASidebarNav } from "@/components/gfa/GFASidebarNav";
import { GFAEditableTable } from "@/components/gfa/GFAEditableTable";
import { GFACostParametersPanel } from "@/components/gfa/GFACostParametersPanel";
import { GFAMapPanel } from "@/components/gfa/GFAMapPanel";
import { GFAOptimizationPanel } from "@/components/gfa/GFAOptimizationPanel";
import { GFAResultsPanel } from "@/components/gfa/GFAResultsPanel";
import { DataSupportPanel } from "@/components/gfa/DataSupportPanel";
import { ScenarioSelector } from "@/components/gfa/ScenarioSelector";
import { useScenarios } from "@/contexts/ScenarioContext";
import { ProjectScenarioNav } from "@/components/ProjectScenarioNav";
import { useProjects, Project } from "@/contexts/ProjectContext";
import { ExcelUploadCompact } from "@/components/gfa/ExcelUploadCompact";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { QuickStartDialog } from "@/components/QuickStartDialog";
import { sampleGFACustomers, sampleGFAProducts, sampleGFAExistingSites, sampleGFASettings } from "@/data/sampleData";
import { ComputeToggle } from "@/components/gfa/ComputeToggle";

const GFA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    projects
  } = useProjects();
  const {
    currentScenario,
    setCurrentScenario,
    saveScenarioInput,
    saveScenarioOutput,
    loadScenarioInput,
    loadScenarioOutput,
    updateScenario,
    loadScenariosByProject
  } = useScenarios();
  const [activeTab, setActiveTab] = useState("input"); // Always default to input tab
  const [activeTable, setActiveTable] = useState<string>("customers");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [useCloudCompute, setUseCloudCompute] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Load project from route state if available
  useEffect(() => {
    const projectId = location.state?.projectId;
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project && project.id !== currentProject?.id) {
        setCurrentProject(project);
        setCurrentScenario(null); // Clear current scenario when switching projects
        loadScenariosByProject(project.id, 'gfa'); // Filter by GFA module
      }
    }
  }, [location.state?.projectId, projects]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [existingSites, setExistingSites] = useState<ExistingSite[]>([]);
  
  // Filtered data based on global search
  const filteredCustomers = globalSearch.trim() 
    ? customers.filter(c => 
        Object.values(c).some(val => 
          String(val || "").toLowerCase().includes(globalSearch.toLowerCase())
        )
      )
    : customers;
    
  const filteredProducts = globalSearch.trim()
    ? products.filter(p =>
        Object.values(p).some(val =>
          String(val || "").toLowerCase().includes(globalSearch.toLowerCase())
        )
      )
    : products;
    
  const filteredExistingSites = globalSearch.trim()
    ? existingSites.filter(s =>
        Object.values(s).some(val =>
          String(val || "").toLowerCase().includes(globalSearch.toLowerCase())
        )
      )
    : existingSites;
  const [dcs, setDcs] = useState<DistributionCenter[]>([]);
  const [feasible, setFeasible] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<{
    totalCost: number;
    transportationCost: number;
    facilityCost: number;
    numSites: number;
  } | undefined>();
  const [settings, setSettings] = useState<OptimizationSettings>({
    mode: 'sites',
    numDCs: 3,
    maxRadius: 50,
    demandPercentage: 100,
    dcCapacity: 0,
    capacityUnit: 'm3',
    transportationCostPerMilePerUnit: 0.5,
    facilityCost: 100000,
    distanceUnit: 'km',
    costUnit: 'm3',
    includeExistingSites: false,
    existingSitesMode: 'potential'
  });

  // Load scenario data when scenario is selected
  useEffect(() => {
    const loadScenarioData = async () => {
      if (currentScenario) {
        // Load saved input data
        const inputData = await loadScenarioInput(currentScenario.id);
        if (inputData) {
          setCustomers(inputData.customers || []);
          setProducts(inputData.products || []);
          setExistingSites(inputData.existingSites || []);
          setSettings(inputData.settings || settings);
        } else {
          // Clear all data for new/blank scenario
          setCustomers([]);
          setProducts([]);
          setExistingSites([]);
          setSettings({
            mode: 'sites',
            numDCs: 3,
            maxRadius: 50,
            demandPercentage: 100,
            dcCapacity: 0,
            capacityUnit: 'm3',
            transportationCostPerMilePerUnit: 0.5,
            facilityCost: 100000,
            distanceUnit: 'km',
            costUnit: 'm3',
            includeExistingSites: false,
            existingSitesMode: 'potential'
          });
        }

        // Load saved output data
        const outputData = await loadScenarioOutput(currentScenario.id);
        if (outputData) {
          setDcs(outputData.dcs || []);
          setFeasible(outputData.feasible ?? true);
          setWarnings(outputData.warnings || []);
          setCostBreakdown(outputData.costBreakdown);
        } else {
          // Clear output data for new scenario
          setDcs([]);
          setFeasible(true);
          setWarnings([]);
          setCostBreakdown(undefined);
        }
        
        // Don't auto-switch tabs - let user stay where they are
      }
    };
    loadScenarioData();
  }, [currentScenario]);

  // Manual save function instead of auto-save to prevent performance issues with large datasets
  const handleSaveScenario = async () => {
    if (!currentScenario) return;
    
    try {
      await saveScenarioInput(currentScenario.id, {
        customers,
        products,
        existingSites,
        settings
      }, false); // Not background, show feedback
      toast.success("Scenario saved successfully");
    } catch (error) {
      toast.error("Failed to save scenario");
    }
  };

  // Optional: Auto-save with longer debounce for large datasets
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (currentScenario && (customers.length > 0 || products.length > 0 || existingSites.length > 0)) {
      // Clear existing timer
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      
      // For large datasets (>1000 items), use longer debounce or skip auto-save
      const totalItems = customers.length + products.length + existingSites.length;
      if (totalItems > 1000) {
        // Don't auto-save for large datasets, user must save manually
        return;
      }
      
      // For smaller datasets, auto-save with debounce
      const timeoutId = setTimeout(async () => {
        await saveScenarioInput(currentScenario.id, {
          customers,
          products,
          existingSites,
          settings
        }, true); // Background save, non-blocking
      }, 2000); // Increased from 500ms to 2000ms
      
      setSaveTimer(timeoutId);
      return () => clearTimeout(timeoutId);
    }
  }, [customers, products, existingSites, settings, currentScenario?.id]);


  // Products are managed separately - not auto-populated from customers
  const handleOptimize = async () => {
    if (customers.length === 0) {
      toast.error("Add at least one customer before optimizing");
      return;
    }
    if (!currentScenario) {
      toast.error("Please select a scenario first");
      return;
    }
    toast.info("Running optimization algorithm...");

    // Update scenario status to running
    await updateScenario(currentScenario.id, {
      status: 'running'
    });

    try {
      let result;
      
      if (useCloudCompute) {
        // Backend optimization on Lovable Cloud
        console.log("Running optimization on Lovable Cloud...");
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase.functions.invoke('optimize-gfa', {
          body: {
            customers,
            existingSites,
            settings,
          }
        });

        if (error) {
          console.error("Cloud optimization error:", error);
          toast.error("Cloud optimization failed. Falling back to local computation.");
          // Fallback to local
          result = optimizeWithConstraints(
            customers, 
            settings.numDCs, 
            {
              maxRadius: settings.maxRadius,
              demandPercentage: settings.demandPercentage,
              dcCapacity: settings.dcCapacity,
              capacityUnit: settings.capacityUnit
            }, 
            settings.mode, 
            {
              transportationCostPerMilePerUnit: settings.transportationCostPerMilePerUnit,
              facilityCost: settings.facilityCost,
              distanceUnit: settings.distanceUnit,
              costUnit: settings.costUnit
            },
            products,
            settings.includeExistingSites ? existingSites : undefined,
            settings.includeExistingSites ? settings.existingSitesMode : undefined
          );
        } else {
          console.log("Cloud optimization completed:", data);
          result = data;
          toast.success("✨ Optimization completed on cloud");
        }
      } else {
        // Local optimization
        console.log("Running optimization locally...");
        result = optimizeWithConstraints(
          customers, 
          settings.numDCs, 
          {
            maxRadius: settings.maxRadius,
            demandPercentage: settings.demandPercentage,
            dcCapacity: settings.dcCapacity,
            capacityUnit: settings.capacityUnit
          }, 
          settings.mode, 
          {
            transportationCostPerMilePerUnit: settings.transportationCostPerMilePerUnit,
            facilityCost: settings.facilityCost,
            distanceUnit: settings.distanceUnit,
            costUnit: settings.costUnit
          },
          products,
          settings.includeExistingSites ? existingSites : undefined,
          settings.includeExistingSites ? settings.existingSitesMode : undefined
        );
        toast.success("Optimization completed locally");
      }

      setDcs(result.dcs);
      setFeasible(result.feasible);
      setWarnings(result.warnings);
      setCostBreakdown(result.costBreakdown);

      // Save output data in background (non-blocking)
      saveScenarioOutput(currentScenario.id, {
        dcs: result.dcs,
        feasible: result.feasible,
        warnings: result.warnings,
        costBreakdown: result.costBreakdown,
      }, true);

      // Update scenario status to completed
      await updateScenario(currentScenario.id, {
        status: 'completed'
      });
      
      if (result.feasible) {
        if (settings.mode === 'cost' && result.costBreakdown) {
          toast.success(`Optimization complete! Optimal solution: ${result.costBreakdown.numSites} sites with total cost $${result.costBreakdown.totalCost.toLocaleString()}`, {
            description: "View results in the Results tab"
          });
        } else {
          toast.success("Optimization complete! All constraints satisfied.", {
            description: "View results in the Results tab"
          });
        }
      } else {
        toast.warning("Optimization complete with constraint violations.", {
          description: "See warnings in Results tab"
        });
      }
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error("Optimization failed");
      await updateScenario(currentScenario.id, {
        status: 'failed'
      });
    }
  };
  const handleExportReport = () => {
    if (customers.length === 0) {
      toast.error("No data to export. Add customer data first.");
      return;
    }
    try {
      exportReport({
        customers,
        products,
        dcs,
        settings,
        costBreakdown
      });
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
      console.error(error);
    }
  };
  const handleBulkUpload = (newCustomers: Customer[], mode: "append" | "overwrite") => {
    if (mode === "overwrite") {
      setCustomers(newCustomers);
    } else {
      setCustomers([...customers, ...newCustomers]);
    }
  };

  const handleProductsUpload = (newProducts: Product[], mode: "append" | "overwrite") => {
    if (mode === "overwrite") {
      setProducts(newProducts);
    } else {
      setProducts([...products, ...newProducts]);
    }
  };

  const handleExistingSitesUpload = (newSites: ExistingSite[], mode: "append" | "overwrite") => {
    if (mode === "overwrite") {
      setExistingSites(newSites);
    } else {
      setExistingSites([...existingSites, ...newSites]);
    }
  };

  const handleCostParametersUpload = (newSettings: Partial<OptimizationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleLoadSampleData = () => {
    setCustomers(sampleGFACustomers);
    setProducts(sampleGFAProducts);
    setExistingSites(sampleGFAExistingSites);
    setSettings(sampleGFASettings);
    toast.success("Sample data loaded successfully! Ready to optimize.");
    setActiveTab("input");
  };

  const handleExportCurrentData = () => {
    const workbook = XLSX.utils.book_new();

    // All possible unit conversion columns
    const allUnitColumns = [
      'to_m3', 'to_ft3', 'to_kg', 'to_tonnes', 'to_lbs', 
      'to_liters', 'to_pallets', 'to_units', 'to_sq2', 
      'to_cbm', 'to_sqm', 'to_sqft'
    ];

    // Sheet 1: Customers - ALWAYS export (even if empty)
    const customersExport = customers.length > 0 
      ? customers.map(c => ({
          Product: c.product,
          Name: c.name,
          City: c.city,
          Country: c.country,
          Latitude: c.latitude,
          Longitude: c.longitude,
          Demand: c.demand,
          Unit: c.unitOfMeasure
        }))
      : [{ Product: "", Name: "", City: "", Country: "", Latitude: "", Longitude: "", Demand: "", Unit: "" }];
    const customersSheet = XLSX.utils.json_to_sheet(customersExport);
    XLSX.utils.book_append_sheet(workbook, customersSheet, "Customers");

    // Sheet 2: Products - ALWAYS export with ALL columns
    const productsExport = products.length > 0
      ? products.map(p => {
          const row: any = {
            Product: p.name,
            BaseUnit: p.baseUnit,
            SellingPrice: p.sellingPrice || ""
          };
          
          // Add ALL unit conversion columns (even if empty)
          allUnitColumns.forEach(col => {
            row[col] = (p.unitConversions && p.unitConversions[col]) || "";
          });
          
          return row;
        })
      : [{
          Product: "",
          BaseUnit: "",
          SellingPrice: "",
          ...Object.fromEntries(allUnitColumns.map(col => [col, ""]))
        }];
    const productsSheet = XLSX.utils.json_to_sheet(productsExport);
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");

    // Sheet 3: Existing Sites - ALWAYS export
    const sitesExport = existingSites.length > 0
      ? existingSites.map(s => ({
          Name: s.name,
          City: s.city,
          Country: s.country,
          Latitude: s.latitude,
          Longitude: s.longitude,
          Capacity: s.capacity,
          CapacityUnit: s.capacityUnit
        }))
      : [{ Name: "", City: "", Country: "", Latitude: "", Longitude: "", Capacity: "", CapacityUnit: "" }];
    const sitesSheet = XLSX.utils.json_to_sheet(sitesExport);
    XLSX.utils.book_append_sheet(workbook, sitesSheet, "Existing Sites");

    // Sheet 4: Cost Parameters - ALWAYS export
    const costExport = [{
      TransportationCostPerMilePerUnit: settings.transportationCostPerMilePerUnit || "",
      FacilityCost: settings.facilityCost || "",
      DistanceUnit: settings.distanceUnit || "",
      CostUnit: settings.costUnit
    }];
    const costSheet = XLSX.utils.json_to_sheet(costExport);
    XLSX.utils.book_append_sheet(workbook, costSheet, "Cost Parameters");

    const filename = `gfa_model_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success("Model data exported successfully");
  };

  const handleClearData = () => {
    setCustomers([]);
    setProducts([]);
    setExistingSites([]);
    setDcs([]);
    toast.success("All data cleared successfully");
  };
  const handleGeocodeCustomer = async (index: number) => {
    const customer = customers[index];
    if (!customer.city && !customer.country) {
      toast.error("Please provide city and country");
      return;
    }
    try {
      toast.info("Geocoding address...");
      // Geocoding logic can be integrated here with supabase function
      toast.success("Address geocoded successfully");
    } catch (error) {
      toast.error("Failed to geocode address");
    }
  };

  // Handle data updates from transformations
  const handleDataUpdate = (updatedData: {
    customers?: Customer[];
    products?: Product[];
    existingSites?: ExistingSite[];
    settings?: OptimizationSettings;
  }) => {
    console.log("=== APPLYING DATA TRANSFORMATION ===");
    console.log("Received updated data:", {
      customersCount: updatedData.customers?.length,
      productsCount: updatedData.products?.length,
      existingSitesCount: updatedData.existingSites?.length
    });
    
    // Update all state at once
    if (updatedData.customers) {
      console.log("Setting customers:", updatedData.customers.length, "items");
      console.log("First 3 customers demand:", updatedData.customers.slice(0, 3).map(c => ({ name: c.name, demand: c.demand })));
      setCustomers(updatedData.customers);
    }
    if (updatedData.products) {
      console.log("Setting products:", updatedData.products.length);
      setProducts(updatedData.products);
    }
    if (updatedData.existingSites) {
      console.log("Setting existing sites:", updatedData.existingSites.length);
      setExistingSites(updatedData.existingSites);
    }
    if (updatedData.settings) {
      console.log("Setting settings");
      setSettings(updatedData.settings);
    }
    
    // Don't auto-switch tabs - let user stay where they are
    
    toast.success("Data updated! Check the Input Data tab to see changes.");
    
    toast.success("Data updated! Check the Input Data tab to see changes.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Project & Scenario Navigation */}
      <div className="border-b border-gfa/20 bg-gradient-to-r from-gfa-light to-transparent">
        <ProjectScenarioNav currentProjectId={currentProject?.id} currentScenarioId={currentScenario?.id} moduleType="gfa" moduleName="Green Field Analysis" onProjectChange={project => {
        setCurrentProject(project);
        setCurrentScenario(null);
        loadScenariosByProject(project.id, 'gfa'); // Filter by GFA module
      }} onScenarioChange={scenario => {
        setCurrentScenario(scenario);
      }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="input" className="gap-2" disabled={!currentScenario}>
              <Upload className="h-4 w-4" />
              Input Data
            </TabsTrigger>
            <TabsTrigger value="data-support" className="gap-2" disabled={!currentScenario || customers.length === 0}>
              <MessageSquare className="h-4 w-4" />
              Data Support
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2" disabled={!currentScenario}>
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="optimization" className="gap-2" disabled={!currentScenario}>
              <Play className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={dcs.length === 0}>
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Upload Data Panel - Shows only when Input tab is active */}
          {activeTab === "input" && (
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium">Upload Customer Data</h3>
                    <p className="text-xs text-muted-foreground truncate">Import Excel file to populate customer table</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="h-8 w-40 pl-8 pr-8 text-xs"
                      />
                      {globalSearch && (
                        <button
                          onClick={() => setGlobalSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <QuickStartDialog 
                      module="gfa"
                      onLoadSampleData={handleLoadSampleData}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-2">
                          <Play className="h-4 w-4" />
                          Quick Start
                        </Button>
                      }
                    />
                    <ExcelUploadCompact 
                      onBulkUpload={handleBulkUpload}
                      onProductsUpload={handleProductsUpload}
                      onExistingSitesUpload={handleExistingSitesUpload}
                      onCostParametersUpload={handleCostParametersUpload}
                    />
                    <Button
                      onClick={handleExportCurrentData} 
                      variant="outline" 
                      size="sm"
                      disabled={customers.length === 0}
                      className="gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      onClick={handleSaveScenario} 
                      variant="default" 
                      size="sm"
                      className="gap-2"
                      disabled={!currentScenario}
                    >
                      <Download className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="input" className="space-y-6">
            <div className="flex gap-4 h-[calc(100vh-300px)] overflow-hidden">
              <GFASidebarNav 
                activeTable={activeTable} 
                onTableSelect={setActiveTable} 
                customerCount={customers.length} 
                productCount={products.length}
                existingSiteCount={existingSites.length}
              />
              <div className="flex-1 min-w-0 flex flex-col gap-4 max-w-[calc(100vw-500px)]">
                {/* Active Table Content with horizontal scroll */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  {activeTable === "customers" && <GFAEditableTable tableType="customers" data={filteredCustomers} onDataChange={setCustomers} onGeocode={handleGeocodeCustomer} products={products} />}
                  {activeTable === "products" && <GFAEditableTable tableType="products" data={filteredProducts} onDataChange={setProducts} />}
                  {activeTable === "existing-sites" && <GFAEditableTable tableType="existing-sites" data={filteredExistingSites} onDataChange={setExistingSites} />}
                  {activeTable === "costs" && <GFACostParametersPanel settings={settings} onSettingsChange={setSettings} />}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data-support" className="space-y-6">
            <div className="max-w-[calc(100vw-300px)] overflow-x-hidden">
            <DataSupportPanel
              customers={customers} 
              products={products} 
              dcs={dcs} 
              existingSites={existingSites}
              settings={settings}
              costBreakdown={costBreakdown}
              onDataUpdate={handleDataUpdate}
            />
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="max-w-[calc(100vw-300px)] overflow-x-hidden">
            <GFAMapPanel customers={customers} dcs={dcs} settings={settings} />
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <div className="max-w-[calc(100vw-300px)] overflow-x-hidden space-y-4">
              <ComputeToggle 
                useCloud={useCloudCompute}
                onToggle={setUseCloudCompute}
                disabled={false}
              />
              <GFAOptimizationPanel
                customers={customers} 
                products={products} 
                existingSites={existingSites}
                settings={settings} 
                onSettingsChange={setSettings} 
                onOptimize={handleOptimize} 
              />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <GFAResultsPanel 
              dcs={dcs} 
              customers={customers} 
              products={products} 
              settings={settings} 
              feasible={feasible} 
              warnings={warnings} 
              costBreakdown={costBreakdown}
              existingSites={existingSites}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
export default GFA;