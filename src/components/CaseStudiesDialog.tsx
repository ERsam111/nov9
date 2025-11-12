import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, TrendingUp, Gauge, CheckCircle2, ArrowRight } from "lucide-react";

interface CaseStudiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CaseStudiesDialog({ open, onOpenChange }: CaseStudiesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Case Studies & User Guides</DialogTitle>
          <DialogDescription>
            Comprehensive guides to help you get started with each optimization tool
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gfa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gfa">
              <MapPin className="h-4 w-4 mr-2" />
              GFA
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <TrendingUp className="h-4 w-4 mr-2" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Gauge className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            {/* GFA Case Study */}
            <TabsContent value="gfa" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gfa" />
                    Green Field Analysis (GFA)
                  </CardTitle>
                  <CardDescription>
                    Find the best locations for warehouses and distribution centers to minimize costs and serve customers efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-base">📥 Required Inputs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Customer Data</p>
                        <p className="text-xs text-muted-foreground">• Customer names and IDs<br/>• Geographic coordinates (latitude/longitude) or addresses<br/>• Demand quantities per customer<br/>• Product types ordered</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Product Information</p>
                        <p className="text-xs text-muted-foreground">• Product names and SKUs<br/>• Weight per unit<br/>• Volume/dimensions<br/>• Unit prices</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Existing Facilities (Optional)</p>
                        <p className="text-xs text-muted-foreground">• Current warehouse/DC locations<br/>• Existing capacity limits<br/>• Operating costs</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">⚙️ Settings & Configuration</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Cost Parameters</p>
                        <p className="text-xs text-muted-foreground">• Transportation cost per km/mile<br/>• Fuel surcharges<br/>• Fixed facility opening costs<br/>• Variable handling costs per unit</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Candidate Site Selection</p>
                        <p className="text-xs text-muted-foreground">• Mark potential DC locations on map<br/>• Set capacity constraints per site<br/>• Define minimum/maximum number of facilities<br/>• Specify service radius limits</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Optimization Constraints</p>
                        <p className="text-xs text-muted-foreground">• Maximum facilities to open<br/>• Budget limitations<br/>• Capacity constraints<br/>• Service level requirements</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">🔄 How It Works</h3>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gfa/20 flex items-center justify-center text-xs font-medium">1</div>
                        <div>
                          <p className="text-sm font-medium">Upload & Visualize Data</p>
                          <p className="text-xs text-muted-foreground">Import customer locations and view them on an interactive map</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gfa/20 flex items-center justify-center text-xs font-medium">2</div>
                        <div>
                          <p className="text-sm font-medium">Define Candidate Sites</p>
                          <p className="text-xs text-muted-foreground">Click on map to mark potential facility locations or use auto-suggest</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gfa/20 flex items-center justify-center text-xs font-medium">3</div>
                        <div>
                          <p className="text-sm font-medium">Configure Parameters</p>
                          <p className="text-xs text-muted-foreground">Set transportation costs, facility costs, and constraints</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gfa/20 flex items-center justify-center text-xs font-medium">4</div>
                        <div>
                          <p className="text-sm font-medium">Run Optimization</p>
                          <p className="text-xs text-muted-foreground">Algorithm evaluates all site combinations to minimize total cost</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gfa/20 flex items-center justify-center text-xs font-medium">5</div>
                        <div>
                          <p className="text-sm font-medium">Review & Compare</p>
                          <p className="text-xs text-muted-foreground">Analyze results, create scenarios, and compare alternatives</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">📤 Expected Outputs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Optimal Network Design</p>
                        <p className="text-xs text-muted-foreground">Recommended facility locations with customer assignments shown on map</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Cost Breakdown</p>
                        <p className="text-xs text-muted-foreground">Total costs split by: transportation, facility opening, handling, and storage</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Distance & Coverage Analysis</p>
                        <p className="text-xs text-muted-foreground">Average delivery distance, maximum distance, total miles, service coverage %</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Profitability Metrics</p>
                        <p className="text-xs text-muted-foreground">Revenue projections, cost-to-serve per customer, contribution margins, ROI estimates</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Sensitivity Analysis</p>
                        <p className="text-xs text-muted-foreground">Impact of changing costs, demand, or constraints on optimal solution</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Demand Forecasting Case Study */}
            <TabsContent value="forecasting" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-forecasting" />
                    Demand Forecasting
                  </CardTitle>
                  <CardDescription>
                    Predict future demand using historical data and multiple statistical models to optimize inventory planning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-base">📥 Required Inputs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Historical Sales/Demand Data</p>
                        <p className="text-xs text-muted-foreground">• Time series with dates (minimum 12 periods recommended)<br/>• Demand/sales quantities per period<br/>• Product/SKU identifiers for multi-product forecasting<br/>• Excel or CSV format</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Time Period Definition</p>
                        <p className="text-xs text-muted-foreground">• Granularity: Daily, Weekly, or Monthly<br/>• Consistent time intervals (no gaps)<br/>• Sufficient history for seasonality detection (2+ years ideal)</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Additional Context (Optional)</p>
                        <p className="text-xs text-muted-foreground">• Promotional events dates<br/>• Price changes<br/>• External factors (holidays, market events)</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">⚙️ Settings & Configuration</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Forecast Horizon</p>
                        <p className="text-xs text-muted-foreground">• Number of periods to forecast (e.g., next 3, 6, or 12 months)<br/>• Confidence interval levels (80%, 95%)<br/>• Forecast frequency</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Model Selection</p>
                        <p className="text-xs text-muted-foreground">• Moving Average (simple trends)<br/>• Exponential Smoothing (weighted recent data)<br/>• Linear Regression (trend-based)<br/>• ARIMA (complex patterns)<br/>• Auto-select (system chooses best)</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Data Quality Controls</p>
                        <p className="text-xs text-muted-foreground">• Outlier detection sensitivity<br/>• Missing data handling<br/>• Seasonality adjustment<br/>• Trend removal options</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">🔄 How It Works</h3>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-forecasting/20 flex items-center justify-center text-xs font-medium">1</div>
                        <div>
                          <p className="text-sm font-medium">Data Import & Validation</p>
                          <p className="text-xs text-muted-foreground">Upload historical data and system validates format and completeness</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-forecasting/20 flex items-center justify-center text-xs font-medium">2</div>
                        <div>
                          <p className="text-sm font-medium">Data Analytics & Pattern Detection</p>
                          <p className="text-xs text-muted-foreground">System analyzes trends, seasonality, outliers, and data quality</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-forecasting/20 flex items-center justify-center text-xs font-medium">3</div>
                        <div>
                          <p className="text-sm font-medium">Model Training & Selection</p>
                          <p className="text-xs text-muted-foreground">Multiple algorithms run on your data and accuracy is measured</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-forecasting/20 flex items-center justify-center text-xs font-medium">4</div>
                        <div>
                          <p className="text-sm font-medium">Generate Forecasts</p>
                          <p className="text-xs text-muted-foreground">Best-performing model creates predictions with confidence intervals</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-forecasting/20 flex items-center justify-center text-xs font-medium">5</div>
                        <div>
                          <p className="text-sm font-medium">Manual Adjustments & Scenarios</p>
                          <p className="text-xs text-muted-foreground">Override forecasts for specific periods, add promotions, compare scenarios</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">📤 Expected Outputs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Forecast Values with Confidence Bands</p>
                        <p className="text-xs text-muted-foreground">Predicted demand for each future period with upper/lower confidence limits</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Model Performance Metrics</p>
                        <p className="text-xs text-muted-foreground">MAPE (%), RMSE, MAE for each model showing accuracy comparison</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Trend & Seasonality Analysis</p>
                        <p className="text-xs text-muted-foreground">Growth rates, seasonal indices, cyclical patterns, trend direction</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Interactive Charts</p>
                        <p className="text-xs text-muted-foreground">Time series visualization: actual vs predicted, residuals, decomposition</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Scenario Comparison</p>
                        <p className="text-xs text-muted-foreground">Best case, worst case, most likely scenarios with sensitivity analysis</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Downloadable Reports</p>
                        <p className="text-xs text-muted-foreground">Export forecasts to Excel with all metrics and charts</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-forecasting/10 p-4 rounded-lg border border-forecasting/20">
                    <p className="text-sm font-medium mb-1">💡 Pro Tip</p>
                    <p className="text-xs text-muted-foreground">
                      Use the Data Support assistant to clean and transform your historical data before forecasting. It can detect outliers, fill missing values, and suggest adjustments using natural language queries.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Optimization Case Study */}
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-inventory" />
                    Inventory Optimization
                  </CardTitle>
                  <CardDescription>
                    Use Monte Carlo simulation to optimize stock levels across your supply chain and minimize costs while meeting service targets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-base">📥 Required Inputs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Network Structure</p>
                        <p className="text-xs text-muted-foreground">• Facility types: Suppliers, Factories, Distribution Centers, Customers<br/>• Facility locations and connections<br/>• Capacity constraints per facility<br/>• Transportation links and routes</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Product Information</p>
                        <p className="text-xs text-muted-foreground">• Product IDs and descriptions<br/>• Bill of Materials (BOM) for assemblies<br/>• Unit costs, weights, volumes<br/>• Storage requirements</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Demand Data</p>
                        <p className="text-xs text-muted-foreground">• Customer demand quantities<br/>• Demand variability (standard deviation)<br/>• Demand distribution type (normal, poisson, uniform)<br/>• Seasonal patterns</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Lead Time Information</p>
                        <p className="text-xs text-muted-foreground">• Lead times between each facility pair<br/>• Lead time variability<br/>• Production times<br/>• Transportation times</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">⚙️ Settings & Configuration</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Cost Parameters</p>
                        <p className="text-xs text-muted-foreground">• Holding cost per unit per period<br/>• Ordering/setup costs<br/>• Stockout/backorder costs<br/>• Transportation costs per shipment</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Inventory Policy Settings</p>
                        <p className="text-xs text-muted-foreground">• Initial reorder points (ROP)<br/>• Initial order quantities (EOQ)<br/>• Safety stock levels<br/>• Review periods (s,S policies)</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Simulation Parameters</p>
                        <p className="text-xs text-muted-foreground">• Number of simulation runs (e.g., 1,000 - 10,000)<br/>• Simulation time horizon (days/weeks)<br/>• Service level targets (e.g., 95%, 99%)<br/>• Random seed for reproducibility</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Optimization Objectives</p>
                        <p className="text-xs text-muted-foreground">• Minimize total cost<br/>• Maximize service level<br/>• Balance trade-offs<br/>• Set constraints</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">🔄 How It Works</h3>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-inventory/20 flex items-center justify-center text-xs font-medium">1</div>
                        <div>
                          <p className="text-sm font-medium">Network Mapping</p>
                          <p className="text-xs text-muted-foreground">Define your supply chain network structure, facilities, and relationships</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-inventory/20 flex items-center justify-center text-xs font-medium">2</div>
                        <div>
                          <p className="text-sm font-medium">Input Configuration</p>
                          <p className="text-xs text-muted-foreground">Enter demand patterns, BOMs, lead times, costs, and initial inventory policies</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-inventory/20 flex items-center justify-center text-xs font-medium">3</div>
                        <div>
                          <p className="text-sm font-medium">Monte Carlo Simulation</p>
                          <p className="text-xs text-muted-foreground">System runs thousands of scenarios with random demand variations and lead time fluctuations</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-inventory/20 flex items-center justify-center text-xs font-medium">4</div>
                        <div>
                          <p className="text-sm font-medium">Policy Optimization</p>
                          <p className="text-xs text-muted-foreground">Algorithm iterates to find optimal reorder points and order quantities that minimize cost</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-inventory/20 flex items-center justify-center text-xs font-medium">5</div>
                        <div>
                          <p className="text-sm font-medium">Results Analysis</p>
                          <p className="text-xs text-muted-foreground">Review cost breakdown, service levels, inventory trajectories, and compare scenarios</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-base">📤 Expected Outputs</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Optimized Inventory Policies</p>
                        <p className="text-xs text-muted-foreground">Recommended reorder points (s), order-up-to levels (S), and safety stock for each product at each facility</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Cost Analysis</p>
                        <p className="text-xs text-muted-foreground">Total cost breakdown: holding costs, ordering costs, stockout costs, transportation costs, production costs</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Service Level Performance</p>
                        <p className="text-xs text-muted-foreground">Fill rate %, stockout frequency, backorder statistics, order fulfillment metrics</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Inventory Over Time Charts</p>
                        <p className="text-xs text-muted-foreground">Visual graphs showing inventory levels, reorder points, orders placed, and stockouts across simulation period</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Network Flow Visualization</p>
                        <p className="text-xs text-muted-foreground">Map showing product movement between facilities with shipment volumes and frequencies</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Sensitivity Analysis</p>
                        <p className="text-xs text-muted-foreground">Impact of changing demand variability, lead times, or costs on optimal policies and total cost</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Scenario Comparison</p>
                        <p className="text-xs text-muted-foreground">Compare multiple policy alternatives side-by-side with cost vs service level trade-offs</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-inventory/10 p-4 rounded-lg border border-inventory/20">
                    <p className="text-sm font-medium mb-1">💡 Pro Tip</p>
                    <p className="text-xs text-muted-foreground">
                      Start with a simplified network to understand the tool, then gradually add complexity. Use the Data Support assistant to transform and clean your input data using SQL-like UPDATE commands for any column across all tables.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
