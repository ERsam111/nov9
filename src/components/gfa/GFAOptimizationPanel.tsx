import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Settings } from "lucide-react";
import { Customer, Product, OptimizationSettings, ExistingSite } from "@/types/gfa";
import { OptimizationSettings as OptimizationSettingsComponent } from "./OptimizationSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface GFAOptimizationPanelProps {
  customers: Customer[];
  products: Product[];
  existingSites: ExistingSite[];
  settings: OptimizationSettings;
  onSettingsChange: (settings: OptimizationSettings) => void;
  onOptimize: () => void;
}

export function GFAOptimizationPanel({
  customers,
  products,
  existingSites,
  settings,
  onSettingsChange,
  onOptimize,
}: GFAOptimizationPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Summary</CardTitle>
          <CardDescription className="text-xs">Overview of input data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 py-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Customers:</p>
              <p className="font-semibold text-xl">{customers.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Products:</p>
              <p className="font-semibold text-xl">{products.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Existing Sites:</p>
              <p className="font-semibold text-xl">{existingSites.length}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Total Demand:</p>
              <p className="font-semibold text-base">
                {customers.reduce((sum, c) => sum + c.demand, 0).toFixed(2)} units
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Settings */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Optimization Settings
          </CardTitle>
          <CardDescription className="text-xs">
            Configure optimization parameters and constraints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 py-3">
          <OptimizationSettingsComponent
            settings={settings}
            onSettingsChange={onSettingsChange}
            onOptimize={onOptimize}
            disabled={customers.length === 0}
          />
          
          {existingSites.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-existing" className="text-sm font-semibold">
                    Include Existing Sites in Analysis
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Consider your {existingSites.length} existing site{existingSites.length > 1 ? 's' : ''} in the optimization
                  </p>
                </div>
                <Switch
                  id="include-existing"
                  checked={settings.includeExistingSites}
                  onCheckedChange={(checked) => 
                    onSettingsChange({ ...settings, includeExistingSites: checked })
                  }
                />
              </div>

              {settings.includeExistingSites && (
                <div className="pl-4 space-y-2">
                  <Label className="text-xs font-medium">Site Inclusion Mode</Label>
                  <RadioGroup
                    value={settings.existingSitesMode}
                    onValueChange={(value: 'potential' | 'always') =>
                      onSettingsChange({ ...settings, existingSitesMode: value })
                    }
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="potential" id="potential" />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor="potential"
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Consider as Potential Sites
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Existing sites compete with new locations. May or may not be selected in the final solution.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="always" id="always" />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor="always"
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Always Include
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Existing sites are always in the solution. Additional sites may be added as needed.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Optimization */}
      <Card className="lg:col-span-3 bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base mb-0.5">Ready to Optimize</h3>
              <p className="text-xs text-muted-foreground">
                Run the optimization algorithm to find the best distribution center locations
              </p>
            </div>
            <Button
              onClick={onOptimize}
              disabled={customers.length === 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Run Optimization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
