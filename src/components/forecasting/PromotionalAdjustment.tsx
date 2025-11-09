import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ForecastResult } from "@/types/forecasting";
import { toast } from "sonner";
import { Scenario3InputForm } from "./Scenario3Input";
import { Scenario3Results } from "./Scenario3Results";
import { Scenario3Input, Scenario3Output } from "@/types/scenario3";
import { processScenario3Adjustments } from "@/utils/elasticityCalculator";
import { getScenario2Results, saveScenario3Results } from "@/utils/scenarioStorage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PromotionalAdjustmentProps {
  forecastResults: ForecastResult[];
  selectedProduct: string;
  granularity: "daily" | "weekly" | "monthly";
  uniqueProducts: string[];
}

export function PromotionalAdjustment({
  forecastResults,
  selectedProduct,
  granularity,
  uniqueProducts,
}: PromotionalAdjustmentProps) {
  const [results, setResults] = useState<Scenario3Output[]>([]);
  const [scenario2Data, setScenario2Data] = useState<any>(null);

  useEffect(() => {
    // Load Scenario 2 results
    const s2 = getScenario2Results();
    if (s2) {
      setScenario2Data(s2);
    }
    
    // Load saved Scenario 3 results
    const s3 = JSON.parse(localStorage.getItem('scenario3_results') || 'null');
    if (s3?.results) {
      setResults(s3.results.map((r: any) => ({
        ...r,
        period: new Date(r.period)
      })));
    }
  }, []);

  const handleDataSubmit = (inputs: Scenario3Input[]) => {
    if (!scenario2Data || scenario2Data.length === 0) {
      toast.error("No Scenario 2 data. Please complete Manual Adjustments first.");
      return;
    }

    try {
      // Enrich inputs with Scenario 2 data
      const enrichedInputs = inputs.flatMap(input => {
        // Filter scenario2 data for matching product and date range
        const matchingS2Data = scenario2Data.filter((s2: any) => {
          const s2Date = new Date(s2.period);
          return s2.product === input.product_name &&
                 s2Date >= input.fromPeriod &&
                 s2Date <= input.toPeriod;
        });

        // Calculate actual price from base price and discount rate
        const actualPrice = input.base_price * (1 - input.discount_rate / 100);

        // Create scenario3 inputs for each matching period
        return matchingS2Data.map((s2: any) => ({
          product_id: s2.product.substring(0, 10),
          product_name: s2.product,
          period: new Date(s2.period),
          scenario2_forecast: s2.adjustedForecast,
          base_price: input.base_price,
          actual_price: actualPrice,
          promotion_flag: (input.discount_rate > 0 ? 1 : 0) as 0 | 1,
          discount_rate: input.discount_rate,
          elasticity: input.elasticity,
          target_units: input.target_units,
          target_revenue: input.target_revenue
        }));
      });

      if (enrichedInputs.length === 0) {
        toast.error("No matching data found for the selected products and date ranges");
        return;
      }

      const processedResults = processScenario3Adjustments(enrichedInputs);
      setResults(processedResults);
      
      // Save results
      saveScenario3Results(processedResults);
      
      toast.success(`Processed ${processedResults.length} forecasts with elasticity adjustments`);
    } catch (error) {
      toast.error("Error processing promotional adjustments");
    }
  };

  // Prepare comparison chart data
  const comparisonChartData = scenario2Data?.slice(0, 10).map((adj: any) => ({
    product: adj.product,
    baseline: adj.baselineForecast,
    scenario2: adj.adjustedForecast
  })) || [];

  // Prepare scenario1Data format for results component
  const scenario1Data = forecastResults.length > 0 ? {
    product: selectedProduct,
    granularity: granularity,
    results: forecastResults
  } : null;

  return (
    <div className="space-y-6">
      {/* Previous Scenarios Comparison */}
      {(scenario1Data || scenario2Data) && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Scenarios</CardTitle>
            <CardDescription>
              Compare baseline and adjusted forecasts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="hsl(var(--muted))" name="Scenario 1" />
                <Bar dataKey="scenario2" fill="hsl(var(--primary))" name="Scenario 2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Scenario 3 Input Form */}
      <Scenario3InputForm onDataSubmit={handleDataSubmit} scenario2Data={scenario2Data} />

      {/* Scenario 3 Results */}
      {results.length > 0 ? (
        <Scenario3Results 
          results={results} 
          scenario1Data={scenario1Data}
          scenario2Data={scenario2Data}
        />
      ) : (
        <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No results yet</p>
            <p className="text-sm mt-2">Enter data and click "Calculate Scenario 3" to see results</p>
          </div>
        </div>
      )}
    </div>
  );
}
