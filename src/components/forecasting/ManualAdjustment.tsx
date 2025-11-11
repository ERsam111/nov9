import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ForecastResult } from "@/types/forecasting";
import { Download, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { toast } from "sonner";
import { Scenario2Input } from "./Scenario2Input";
import { Scenario2Results } from "./Scenario2Results";
import { Scenario2Adjustment, Scenario2AdjustmentWithForecast } from "@/types/scenario2";
import { saveScenario2Results } from "@/utils/scenarioStorage";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ManualAdjustmentProps {
  forecastResults: ForecastResult[];
  selectedProduct: string;
  granularity: "daily" | "weekly" | "monthly";
  uniqueProducts: string[];
}

export function ManualAdjustment({
  forecastResults,
  selectedProduct,
  granularity,
  uniqueProducts,
}: ManualAdjustmentProps) {
  const [adjustments, setAdjustments] = useState<Scenario2Adjustment[]>([]);
  const [enrichedAdjustments, setEnrichedAdjustments] = useState<Scenario2AdjustmentWithForecast[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    forecastResults.find(r => r.isRecommended)?.modelId || forecastResults[0]?.modelId || ""
  );

  // Load saved results on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('scenario2_results') || 'null');
    if (saved?.adjustments) {
      setEnrichedAdjustments(saved.adjustments.map((s: any) => ({
        ...s,
        period: new Date(s.period),
        fromPeriod: new Date(s.fromPeriod),
        toPeriod: new Date(s.toPeriod)
      })));
    }
  }, []);

  const calculateAdjustedForecast = (baseline: number, type: "units" | "percentage", value: number): number => {
    if (type === "units") {
      return baseline + value;
    } else {
      return baseline * (1 + value / 100);
    }
  };

  const handleAdjustmentsSubmit = (data: Scenario2Adjustment[]) => {
    setAdjustments(data);
    
    // Get selected model data
    const selectedModel = forecastResults.find((r: any) => r.modelId === selectedModelId);
    if (!selectedModel) {
      toast.error("No forecast data. Please generate forecasts first.");
      return;
    }

    const enriched: Scenario2AdjustmentWithForecast[] = [];
    
    data.forEach(adj => {
      // Find all predictions within the date range
      const predictions = selectedModel.predictions.filter((pred: any) => {
        const predDate = new Date(pred.date);
        return predDate >= adj.fromPeriod && predDate <= adj.toPeriod;
      });

      predictions.forEach((pred: any) => {
        enriched.push({
          ...adj,
          period: new Date(pred.date),
          baselineForecast: pred.predicted,
          adjustedForecast: calculateAdjustedForecast(pred.predicted, adj.adjustmentType, adj.adjustmentValue)
        });
      });
    });

    setEnrichedAdjustments(enriched);
    
    // Save enriched results
    saveScenario2Results(enriched);
    
    toast.success(`Applied ${data.length} adjustments across ${enriched.length} periods. Results saved.`);
  };

  const selectedModel = forecastResults.find((r: any) => r.modelId === selectedModelId);
  
  // Prepare chart data for baseline visualization
  const scenario1ChartData = selectedModel?.predictions.map((p: any) => ({
    date: new Date(p.date).toISOString().split('T')[0],
    baseline: p.predicted
  })) || [];

  // Prepare scenario1Data format expected by components
  const scenario1Data = forecastResults.length > 0 ? {
    product: selectedProduct,
    granularity: granularity,
    results: forecastResults
  } : null;

  return (
    <div className="space-y-6">
      {/* Baseline Forecast Visualization */}
      {scenario1Data && (
        <Card>
          <CardHeader>
            <CardTitle>Baseline Forecast</CardTitle>
            <CardDescription>
              {scenario1Data.product} - {scenario1Data.granularity} forecast
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Select Forecast Model</Label>
              <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose model" />
                </SelectTrigger>
                <SelectContent>
                  {scenario1Data.results.map((model: any) => (
                    <SelectItem key={model.modelId} value={model.modelId}>
                      {model.modelName} {model.isRecommended && "⭐"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scenario1ChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="baseline" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Scenario 2 Input Form */}
      <Scenario2Input onAdjustmentsSubmit={handleAdjustmentsSubmit} scenario1Data={scenario1Data} />

      {/* Scenario 2 Results */}
      {enrichedAdjustments.length > 0 ? (
        <Scenario2Results adjustments={enrichedAdjustments} scenario1Data={scenario1Data} />
      ) : (
        <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No adjustments yet</p>
            <p className="text-sm mt-2">Apply adjustments above to see results</p>
          </div>
        </div>
      )}
    </div>
  );
}
