import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ForecastResult } from "@/types/forecasting";
import { Calendar, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Promotion {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  uplift: number; // percentage
}

interface PromotionalAdjustmentProps {
  forecastResults: ForecastResult[];
  selectedProduct: string;
  granularity: "daily" | "weekly" | "monthly";
  onPromotionalAdjustmentsChange: (adjustedResults: ForecastResult[]) => void;
  uniqueProducts: string[];
  onProductChange: (product: string) => void;
}

export function PromotionalAdjustment({
  forecastResults,
  selectedProduct,
  granularity,
  onPromotionalAdjustmentsChange,
  uniqueProducts,
  onProductChange
}: PromotionalAdjustmentProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [priceDiscount, setPriceDiscount] = useState<number>(10);
  const [elasticity, setElasticity] = useState<number>(1.5);
  const [targetSales, setTargetSales] = useState<number>(0);
  const [targetRevenue, setTargetRevenue] = useState<number>(0);
  const [recommendedDiscount, setRecommendedDiscount] = useState<number | null>(null);
  const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({
    name: "",
    startDate: new Date(),
    endDate: new Date(),
    uplift: 10
  });

  const addPromotion = () => {
    if (!newPromotion.name || !newPromotion.startDate || !newPromotion.endDate) {
      toast.error("Please fill all promotion fields");
      return;
    }

    if (newPromotion.startDate! > newPromotion.endDate!) {
      toast.error("Start date must be before end date");
      return;
    }

    const promotion: Promotion = {
      id: `promo-${Date.now()}`,
      name: newPromotion.name,
      startDate: newPromotion.startDate!,
      endDate: newPromotion.endDate!,
      uplift: newPromotion.uplift || 10
    };

    setPromotions([...promotions, promotion]);
    setNewPromotion({ name: "", startDate: new Date(), endDate: new Date(), uplift: 10 });
    toast.success(`Promotion "${promotion.name}" added`);
  };

  const removePromotion = (id: string) => {
    setPromotions(promotions.filter(p => p.id !== id));
    toast.success("Promotion removed");
  };

  const applyPromotions = () => {
    if (promotions.length === 0) {
      toast.error("No promotions to apply");
      return;
    }

    const adjustedResults = forecastResults.map(result => {
      const adjustedPredictions = result.predictions.map((pred) => {
        let adjustedValue = pred.predicted;
        const predDate = new Date(pred.date);
        
        // Apply all promotions that overlap with this date
        promotions.forEach(promo => {
          if (predDate >= promo.startDate && predDate <= promo.endDate) {
            adjustedValue = adjustedValue * (1 + promo.uplift / 100);
          }
        });

        return {
          date: pred.date,
          predicted: adjustedValue
        };
      });

      return {
        ...result,
        predictions: adjustedPredictions
      };
    });

    onPromotionalAdjustmentsChange(adjustedResults);
    toast.success(`Applied ${promotions.length} promotion(s) to forecasts`);
  };

  const calculateRecommendedDiscount = () => {
    if (!selectedProduct || forecastResults.length === 0) {
      toast.error("Please select a product and generate forecasts first");
      return;
    }

    const baselineForecast = forecastResults[0]?.predictions.reduce((sum, p) => sum + p.predicted, 0) || 0;
    
    let recommendedDiscountPct = 0;
    
    if (targetSales > 0) {
      // Sales uplift = (Target Sales - Baseline) / Baseline
      const requiredUplift = ((targetSales - baselineForecast) / baselineForecast) * 100;
      // Using price elasticity: % change in demand = elasticity × % change in price
      // Discount needed = Required Uplift / Elasticity
      recommendedDiscountPct = Math.abs(requiredUplift / elasticity);
    } else if (targetRevenue > 0 && baselineForecast > 0) {
      // Simplified revenue optimization: assuming linear relationship
      // This is a basic calculation - real optimization would need unit price data
      const impliedUplift = ((targetRevenue / baselineForecast) - 1) * 100;
      recommendedDiscountPct = Math.abs(impliedUplift / elasticity);
    } else {
      // Use the manual discount input
      recommendedDiscountPct = priceDiscount;
    }

    setRecommendedDiscount(Math.min(recommendedDiscountPct, 80)); // Cap at 80% discount
    toast.success(`Recommended discount: ${Math.min(recommendedDiscountPct, 80).toFixed(1)}% based on elasticity of ${elasticity}`);
  };

  const useRecommendedDiscount = () => {
    if (recommendedDiscount !== null) {
      setNewPromotion({ ...newPromotion, uplift: recommendedDiscount });
      toast.success("Applied recommended discount to promotion");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Promotional Adjustment
          </CardTitle>
          <CardDescription>
            Factor in promotional events and marketing campaigns for {selectedProduct}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={onProductChange}>
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
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-3">Discount Optimization (Optional)</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Set targets to get AI-recommended discount based on price elasticity
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Price Elasticity</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={elasticity}
                  onChange={(e) => setElasticity(parseFloat(e.target.value) || 1.5)}
                  placeholder="e.g., 1.5"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Target Sales (Units)</Label>
                <Input
                  type="number"
                  value={targetSales}
                  onChange={(e) => setTargetSales(parseFloat(e.target.value) || 0)}
                  placeholder="Optional"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Target Revenue</Label>
                <Input
                  type="number"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(parseFloat(e.target.value) || 0)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Manual Discount (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={priceDiscount}
                  onChange={(e) => setPriceDiscount(parseFloat(e.target.value) || 10)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button onClick={calculateRecommendedDiscount} variant="secondary">
                <Sparkles className="h-4 w-4 mr-2" />
                Calculate Optimal Discount
              </Button>
              {recommendedDiscount !== null && (
                <Button onClick={useRecommendedDiscount} variant="outline">
                  Use Recommended: {recommendedDiscount.toFixed(1)}%
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label>Promotion Name</Label>
              <Input
                value={newPromotion.name}
                onChange={(e) => setNewPromotion({ ...newPromotion, name: e.target.value })}
                placeholder="e.g., Summer Sale"
              />
            </div>
            
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newPromotion.startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newPromotion.startDate ? format(newPromotion.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newPromotion.startDate}
                    onSelect={(date) => setNewPromotion({ ...newPromotion, startDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newPromotion.endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newPromotion.endDate ? format(newPromotion.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newPromotion.endDate}
                    onSelect={(date) => setNewPromotion({ ...newPromotion, endDate: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>Uplift (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={newPromotion.uplift}
                onChange={(e) => setNewPromotion({ ...newPromotion, uplift: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addPromotion} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Promotion
            </Button>
            {promotions.length > 0 && (
              <Button onClick={applyPromotions} variant="default" className="gap-2">
                <Calendar className="h-4 w-4" />
                Apply All Promotions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {promotions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Promotions</CardTitle>
            <CardDescription>
              {promotions.length} promotion(s) configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Uplift</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.name}</TableCell>
                    <TableCell>{format(promo.startDate, "PPP")}</TableCell>
                    <TableCell>{format(promo.endDate, "PPP")}</TableCell>
                    <TableCell className="text-green-600 font-semibold">+{promo.uplift}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePromotion(promo.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {promotions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No promotions configured yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add promotional events to adjust your demand forecasts
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
