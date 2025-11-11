import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Customer, Product, ExistingSite, OptimizationSettings } from "@/types/gfa";
import { optimizeWithCost } from "@/utils/geoCalculations";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SensitivityAnalysisProps {
  customers: Customer[];
  products: Product[];
  settings: OptimizationSettings;
  existingSites?: ExistingSite[];
}

interface SensitivityResult {
  facilityCost: number;
  transportationRate: number;
  totalCost: number;
  transportationCost: number;
  facilityCostTotal: number;
  numSites: number;
}

export function SensitivityAnalysis({
  customers,
  products,
  settings,
  existingSites,
}: SensitivityAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [facilityCostResults, setFacilityCostResults] = useState<SensitivityResult[]>([]);
  const [transportationRateResults, setTransportationRateResults] = useState<SensitivityResult[]>([]);

  const runFacilityCostAnalysis = async () => {
    setAnalyzing(true);
    const facilityCosts = [0, 500000, 1000000, 2000000];
    const results: SensitivityResult[] = [];

    for (const facilityCost of facilityCosts) {
      const result = optimizeWithCost(
        customers,
        settings.transportationCostPerMilePerUnit,
        facilityCost,
        settings.distanceUnit,
        settings.costUnit,
        products,
        settings.includeExistingSites ? existingSites : undefined,
        settings.includeExistingSites ? settings.existingSitesMode : undefined
      );

      if (result.costBreakdown) {
        results.push({
          facilityCost,
          transportationRate: settings.transportationCostPerMilePerUnit,
          totalCost: result.costBreakdown.totalCost,
          transportationCost: result.costBreakdown.transportationCost,
          facilityCostTotal: result.costBreakdown.facilityCost,
          numSites: result.dcs.length,
        });
      }
    }

    setFacilityCostResults(results);
    setAnalyzing(false);
  };

  const runTransportationRateAnalysis = async () => {
    setAnalyzing(true);
    const transportationRates = [0.25, 0.5, 1.0, 2.0];
    const results: SensitivityResult[] = [];

    for (const rate of transportationRates) {
      const result = optimizeWithCost(
        customers,
        rate,
        settings.facilityCost,
        settings.distanceUnit,
        settings.costUnit,
        products,
        settings.includeExistingSites ? existingSites : undefined,
        settings.includeExistingSites ? settings.existingSitesMode : undefined
      );

      if (result.costBreakdown) {
        results.push({
          facilityCost: settings.facilityCost,
          transportationRate: rate,
          totalCost: result.costBreakdown.totalCost,
          transportationCost: result.costBreakdown.transportationCost,
          facilityCostTotal: result.costBreakdown.facilityCost,
          numSites: result.dcs.length,
        });
      }
    }

    setTransportationRateResults(results);
    setAnalyzing(false);
  };

  const runBothAnalyses = async () => {
    await runFacilityCostAnalysis();
    await runTransportationRateAnalysis();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sensitivity Analysis
        </CardTitle>
        <CardDescription>
          Analyze how total cost changes with different facility opening costs and transportation rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Button onClick={runBothAnalyses} disabled={analyzing || customers.length === 0}>
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              "Run Sensitivity Analysis"
            )}
          </Button>
          {facilityCostResults.length > 0 && (
            <div className="text-sm text-muted-foreground flex items-center">
              Analysis complete for {facilityCostResults.length + transportationRateResults.length} scenarios
            </div>
          )}
        </div>

        {(facilityCostResults.length > 0 || transportationRateResults.length > 0) && (
          <Tabs defaultValue="facility-cost" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="facility-cost">Facility Opening Cost</TabsTrigger>
              <TabsTrigger value="transportation-rate">Transportation Rate</TabsTrigger>
            </TabsList>

            <TabsContent value="facility-cost" className="space-y-6">
              {facilityCostResults.length > 0 && (
                <>
                  {/* Chart */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Total Cost vs Facility Opening Cost</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={facilityCostResults}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="facilityCost"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          className="text-xs"
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          labelFormatter={(label) => `Facility Cost: $${Number(label).toLocaleString()}`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalCost"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Total Cost"
                        />
                        <Line
                          type="monotone"
                          dataKey="transportationCost"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          name="Transportation Cost"
                        />
                        <Line
                          type="monotone"
                          dataKey="facilityCostTotal"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          name="Facility Cost"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Number of Sites Chart */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Optimal Number of Sites vs Facility Opening Cost</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={facilityCostResults}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="facilityCost"
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          labelFormatter={(label) => `Facility Cost: $${Number(label).toLocaleString()}`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="numSites" fill="hsl(var(--primary))" name="Number of Sites" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Table */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Detailed Results</h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Facility Opening Cost</th>
                            <th className="px-4 py-3 text-right font-medium">Total Cost</th>
                            <th className="px-4 py-3 text-right font-medium">Transportation</th>
                            <th className="px-4 py-3 text-right font-medium">Facility</th>
                            <th className="px-4 py-3 text-right font-medium">Sites</th>
                          </tr>
                        </thead>
                        <tbody>
                          {facilityCostResults.map((result, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-4 py-3">${result.facilityCost.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-medium">
                                ${result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                ${result.transportationCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                ${result.facilityCostTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-3 text-right">{result.numSites}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="transportation-rate" className="space-y-6">
              {transportationRateResults.length > 0 && (
                <>
                  {/* Chart */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Total Cost vs Transportation Rate</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={transportationRateResults}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="transportationRate"
                          tickFormatter={(value) => `$${value}/${settings.distanceUnit}/${settings.costUnit}`}
                          className="text-xs"
                        />
                        <YAxis
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                          className="text-xs"
                        />
                        <Tooltip
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          labelFormatter={(label) => `Rate: $${label}/${settings.distanceUnit}/${settings.costUnit}`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalCost"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Total Cost"
                        />
                        <Line
                          type="monotone"
                          dataKey="transportationCost"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          name="Transportation Cost"
                        />
                        <Line
                          type="monotone"
                          dataKey="facilityCostTotal"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          name="Facility Cost"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Number of Sites Chart */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Optimal Number of Sites vs Transportation Rate</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={transportationRateResults}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="transportationRate"
                          tickFormatter={(value) => `$${value}`}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          labelFormatter={(label) => `Rate: $${label}/${settings.distanceUnit}/${settings.costUnit}`}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="numSites" fill="hsl(var(--primary))" name="Number of Sites" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data Table */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Detailed Results</h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">Transportation Rate</th>
                            <th className="px-4 py-3 text-right font-medium">Total Cost</th>
                            <th className="px-4 py-3 text-right font-medium">Transportation</th>
                            <th className="px-4 py-3 text-right font-medium">Facility</th>
                            <th className="px-4 py-3 text-right font-medium">Sites</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transportationRateResults.map((result, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-4 py-3">
                                ${result.transportationRate.toFixed(2)}/{settings.distanceUnit}/{settings.costUnit}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                ${result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                ${result.transportationCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                ${result.facilityCostTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-4 py-3 text-right">{result.numSites}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        {facilityCostResults.length === 0 && transportationRateResults.length === 0 && !analyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Run Sensitivity Analysis" to see how costs vary with different parameters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
