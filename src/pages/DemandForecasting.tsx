import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, ChevronDown, Upload, Edit, TrendingUp, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoricalDataUpload } from "@/components/forecasting/HistoricalDataUpload";
import { ModelSelector } from "@/components/forecasting/ModelSelector";
import { DataAnalytics } from "@/components/forecasting/DataAnalytics";
import { ForecastResults } from "@/components/forecasting/ForecastResults";
import { OutlierDetection } from "@/components/forecasting/OutlierDetection";
import { TimeFilterPanel } from "@/components/forecasting/TimeFilterPanel";
import { ForecastingDataSupport } from "@/components/forecasting/ForecastingDataSupport";
import { ManualAdjustment } from "@/components/forecasting/ManualAdjustment";
import { PromotionalAdjustment } from "@/components/forecasting/PromotionalAdjustment";

import { HistoricalDataPoint, ForecastResult } from "@/types/forecasting";
import { generateForecasts } from "@/utils/forecastingModels";
import { useToast } from "@/hooks/use-toast";
import { saveScenario1Results, getScenario1Results } from "@/utils/scenarioStorage";
import { ProjectScenarioNav } from "@/components/ProjectScenarioNav";
import { useProjects, Project } from "@/contexts/ProjectContext";
import { useScenarios } from "@/contexts/ScenarioContext";

const DemandForecasting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("input");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { 
    currentScenario, 
    setCurrentScenario, 
    loadScenariosByProject, 
    updateScenario, 
    saveScenarioInput, 
    saveScenarioOutput,
    loadScenarioInput,
    loadScenarioOutput 
  } = useScenarios();
  const [rawHistoricalData, setRawHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(["moving_average", "exponential_smoothing"]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [forecastPeriods, setForecastPeriods] = useState<number>(6);
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [outlierInfo, setOutlierInfo] = useState<any>(null);
  const [modelParams, setModelParams] = useState<Record<string, any>>({
    moving_average: { window: 3 },
    exponential_smoothing: { alpha: 0.3 },
    weighted_moving_average: { window: 3 },
    seasonal_naive: { seasonLength: 12 },
    holt_winters: { alpha: 0.3, beta: 0.1, gamma: 0.1, seasonLength: 12 },
    random_forest: { nTrees: 10, windowSize: 5 },
    arima: { p: 2, d: 1, q: 2 }
  });
  
  // Collapsible section states
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isModelOpen, setIsModelOpen] = useState(true);
  
  // Load scenario data when scenario changes
  useEffect(() => {
    const loadScenarioData = async () => {
      if (currentScenario) {
        // Load saved input data
        const inputData = await loadScenarioInput(currentScenario.id);
        if (inputData) {
          setHistoricalData(inputData.historicalData || []);
          setRawHistoricalData(inputData.rawHistoricalData || []);
          setSelectedProduct(inputData.selectedProduct || "");
          setSelectedCustomer(inputData.selectedCustomer || "all");
          setForecastPeriods(inputData.forecastPeriods || 6);
          if (inputData.granularity === "daily" || inputData.granularity === "weekly" || inputData.granularity === "monthly") {
            setGranularity(inputData.granularity);
          }
          setSelectedModels(inputData.selectedModels || ["moving_average", "exponential_smoothing"]);
          setModelParams(inputData.modelParams || modelParams);
        } else {
          // Clear data for new scenario
          setHistoricalData([]);
          setRawHistoricalData([]);
          setSelectedProduct("");
          setSelectedCustomer("all");
          setForecastPeriods(6);
          setForecastResults([]);
        }

        // Load saved output data
        const outputData = await loadScenarioOutput(currentScenario.id);
        if (outputData) {
          setForecastResults(outputData.forecastResults || []);
        }
      }
    };

    loadScenarioData();
  }, [currentScenario?.id]);

  // Auto-save input data when key parameters change
  useEffect(() => {
    const saveInputData = async () => {
      if (currentScenario && historicalData.length > 0) {
        await saveScenarioInput(currentScenario.id, {
          historicalData,
          rawHistoricalData,
          selectedProduct,
          selectedCustomer,
          forecastPeriods,
          granularity,
          selectedModels,
          modelParams,
          filterStartDate,
          filterEndDate
        });
      }
    };

    // Debounce to avoid too many saves
    const timeoutId = setTimeout(() => {
      saveInputData();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [historicalData, selectedProduct, selectedCustomer, forecastPeriods, granularity, selectedModels, currentScenario?.id]);

  // Update default parameters when granularity changes
  const handleGranularityChange = (newGranularity: string) => {
    const validGranularity = newGranularity as "daily" | "weekly" | "monthly";
    setGranularity(validGranularity);
    
    // Adjust default parameters based on granularity
    const defaultParams = {
      daily: {
        moving_average: { window: 7 },
        exponential_smoothing: { alpha: 0.3 },
        weighted_moving_average: { window: 7 },
        seasonal_naive: { seasonLength: 7 },
        holt_winters: { alpha: 0.3, beta: 0.1, gamma: 0.1, seasonLength: 7 },
        random_forest: { nTrees: 10, windowSize: 7 },
        arima: { p: 2, d: 1, q: 2 }
      },
      weekly: {
        moving_average: { window: 4 },
        exponential_smoothing: { alpha: 0.3 },
        weighted_moving_average: { window: 4 },
        seasonal_naive: { seasonLength: 4 },
        holt_winters: { alpha: 0.3, beta: 0.1, gamma: 0.1, seasonLength: 4 },
        random_forest: { nTrees: 10, windowSize: 4 },
        arima: { p: 2, d: 1, q: 2 }
      },
      monthly: {
        moving_average: { window: 3 },
        exponential_smoothing: { alpha: 0.3 },
        weighted_moving_average: { window: 3 },
        seasonal_naive: { seasonLength: 12 },
        holt_winters: { alpha: 0.3, beta: 0.1, gamma: 0.1, seasonLength: 12 },
        random_forest: { nTrees: 10, windowSize: 5 },
        arima: { p: 2, d: 1, q: 2 }
      }
    };
    
    setModelParams(defaultParams[validGranularity]);
    
    // Adjust forecast periods
    if (validGranularity === "daily") {
      setForecastPeriods(30);
    } else if (validGranularity === "weekly") {
      setForecastPeriods(12);
    } else {
      setForecastPeriods(6);
    }
  };

  const handleDataUpload = (data: HistoricalDataPoint[]) => {
    setRawHistoricalData(data);
    setHistoricalData(data);
    setForecastResults([]);
    setFilterStartDate(null);
    setFilterEndDate(null);
    
    // Auto-select first product if none selected
    if (!selectedProduct && data.length > 0) {
      const firstProduct = data[0].product;
      setSelectedProduct(firstProduct);
    }
  };

  const handleRemoveOutliers = (outlierIndices: number[], method: string, lowerThreshold: number, upperThreshold: number) => {
    const filteredData = historicalData.filter((_, idx) => !outlierIndices.includes(idx));
    setHistoricalData(filteredData);
    setForecastResults([]);
    setOutlierInfo({
      count: outlierIndices.length,
      method,
      lowerThreshold,
      upperThreshold
    });
    
    toast({
      title: "Outliers removed",
      description: `Removed ${outlierIndices.length} outlier data points`
    });
  };

  const handleTimeFilter = (startDate: Date | null, endDate: Date | null) => {
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
    
    let filtered = [...rawHistoricalData];
    
    if (startDate) {
      filtered = filtered.filter(d => d.date >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(d => d.date <= endDate);
    }
    
    setHistoricalData(filtered);
    setForecastResults([]);
    
    toast({
      title: "Filter applied",
      description: `Showing ${filtered.length} data points`
    });
  };

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleParamChange = (modelId: string, paramName: string, value: number) => {
    setModelParams(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        [paramName]: value
      }
    }));
  };

  const runForecasting = async () => {
    if (historicalData.length === 0) {
      toast({
        title: "No data available",
        description: "Please upload historical data first",
        variant: "destructive"
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one forecasting model",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "No product selected",
        description: "Please select a product to forecast",
        variant: "destructive"
      });
      return;
    }

    // Filter data by product and customer
    let filteredData = historicalData.filter(d => d.product === selectedProduct);
    
    if (selectedCustomer !== "all") {
      filteredData = filteredData.filter(d => d.customer === selectedCustomer);
    }

    if (filteredData.length < 3) {
      toast({
        title: "Insufficient data",
        description: "Need at least 3 data points for forecasting",
        variant: "destructive"
      });
      return;
    }

    // Generate forecasts
    const results = generateForecasts(filteredData, forecastPeriods, selectedModels, modelParams, granularity);
    setForecastResults(results);

    // Save input data to scenario
    if (currentScenario) {
      await saveScenarioInput(currentScenario.id, {
        historicalData,
        rawHistoricalData,
        selectedProduct,
        selectedCustomer,
        forecastPeriods,
        granularity,
        selectedModels,
        modelParams,
        filterStartDate,
        filterEndDate
      });

      // Save output data to scenario
      await saveScenarioOutput(currentScenario.id, {
        forecastResults: results
      });

      // Mark scenario as completed
      await updateScenario(currentScenario.id, {
        status: 'completed'
      });
    }

    // Also save for backward compatibility with Scenario 2
    saveScenario1Results(results, selectedProduct, granularity);

    toast({
      title: "Forecast generated",
      description: `Forecast completed and saved to scenario.`
    });
  };

  // Get unique products and customers for filters
  const uniqueProducts = Array.from(new Set(historicalData.map(d => d.product)));
  const uniqueCustomers = Array.from(new Set(historicalData.map(d => d.customer)));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Project & Scenario Navigation */}
      <div className="border-b border-forecasting/20 bg-gradient-to-r from-forecasting-light to-transparent">
        <ProjectScenarioNav
          currentProjectId={currentProject?.id}
          currentScenarioId={currentScenario?.id}
          moduleType="forecasting"
          moduleName="Demand Forecasting"
          onProjectChange={(project) => {
            setCurrentProject(project);
            loadScenariosByProject(project.id, 'forecasting');
          }}
          onScenarioChange={(scenario) => {
            setCurrentScenario(scenario);
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="input" className="gap-2" disabled={!currentScenario}>
              <Upload className="h-4 w-4" />
              Input Data
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2" disabled={forecastResults.length === 0}>
              <Edit className="h-4 w-4" />
              Manual Adjustment
            </TabsTrigger>
            <TabsTrigger value="promotional" className="gap-2" disabled={forecastResults.length === 0}>
              <TrendingUp className="h-4 w-4" />
              Promotional Adjustment
            </TabsTrigger>
            <TabsTrigger value="data-support" className="gap-2" disabled={!currentScenario || historicalData.length === 0}>
              <MessageSquare className="h-4 w-4" />
              Data Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Upload</CardTitle>
                <CardDescription>Upload historical demand data to begin forecasting</CardDescription>
              </CardHeader>
              <CardContent>
                <HistoricalDataUpload onDataUpload={handleDataUpload} />
              </CardContent>
            </Card>

              {historicalData.length > 0 && (
                <>
                  <DataAnalytics data={historicalData} />

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Preprocessing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Time Filter</h4>
                        <TimeFilterPanel
                          startDate={filterStartDate}
                          endDate={filterEndDate}
                          onFilterChange={handleTimeFilter}
                        />
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Outlier Detection</h4>
                        <OutlierDetection
                          data={historicalData}
                          onRemoveOutliers={handleRemoveOutliers}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>Forecast Configuration</CardTitle>
                              <CardDescription>Select product and forecast parameters</CardDescription>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Product</Label>
                              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {uniqueProducts.map(product => (
                                    <SelectItem key={product} value={product}>
                                      {product}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Customer (Optional)</Label>
                              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Customers</SelectItem>
                                  {uniqueCustomers.map(customer => (
                                    <SelectItem key={customer} value={customer}>
                                      {customer}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Forecast Granularity</Label>
                              <Select value={granularity} onValueChange={handleGranularityChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>
                                Forecast Horizon ({granularity === "daily" ? "Days" : granularity === "weekly" ? "Weeks" : "Months"})
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                max={granularity === "daily" ? 365 : granularity === "weekly" ? 52 : 24}
                                value={forecastPeriods}
                                onChange={(e) => setForecastPeriods(Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  <Collapsible open={isModelOpen} onOpenChange={setIsModelOpen}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle>Model Selection</CardTitle>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isModelOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          <ModelSelector
                            selectedModels={selectedModels}
                            onModelToggle={handleModelToggle}
                            modelParams={modelParams}
                            onParamChange={handleParamChange}
                            granularity={granularity}
                          />
                          
                          <Button
                            onClick={runForecasting}
                            disabled={!selectedProduct || selectedModels.length === 0}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Generate Forecast
                          </Button>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {forecastResults.length > 0 && (
                    <div className="space-y-6">
                      <ForecastResults
                        results={forecastResults}
                        historicalData={historicalData.filter(d => 
                          d.product === selectedProduct &&
                          (selectedCustomer === "all" || d.customer === selectedCustomer)
                        )}
                        product={selectedProduct}
                        granularity={granularity}
                      />
                    </div>
                  )}
                </>
              )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <ManualAdjustment
              forecastResults={forecastResults}
              selectedProduct={selectedProduct}
              granularity={granularity}
              uniqueProducts={uniqueProducts}
            />
          </TabsContent>

          <TabsContent value="promotional" className="space-y-6">
            <PromotionalAdjustment
              forecastResults={forecastResults}
              selectedProduct={selectedProduct}
              granularity={granularity}
              uniqueProducts={uniqueProducts}
            />
          </TabsContent>

          <TabsContent value="data-support" className="space-y-6">
            <ForecastingDataSupport
              historicalData={historicalData}
              forecastResults={forecastResults}
              selectedProduct={selectedProduct}
              selectedCustomer={selectedCustomer}
              granularity={granularity}
              forecastPeriods={forecastPeriods}
              modelParams={modelParams}
              currentScenario={currentScenario}
              outlierAnalysis={outlierInfo}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DemandForecasting;
