import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Customer, DistributionCenter, OptimizationSettings } from "@/types/gfa";
import { MapView } from "./MapView";

interface GFAMapPanelProps {
  customers: Customer[];
  dcs: DistributionCenter[];
  settings: OptimizationSettings;
}

export function GFAMapPanel({ customers, dcs, settings }: GFAMapPanelProps) {
  const [distanceRangeStep, setDistanceRangeStep] = useState<number>(100);

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex gap-4">
        <Card className="w-fit">
          <CardContent className="pt-2 pb-2">
            <div className="flex gap-3 items-center">
              <div className="space-y-1">
                <Label className="text-[10px]">Distance Range Step</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={distanceRangeStep}
                  onChange={(e) => setDistanceRangeStep(Number(e.target.value) || 100)}
                  className="w-[80px] h-8 text-xs"
                  placeholder="100"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Unit</Label>
                <Select value={settings.distanceUnit} disabled>
                  <SelectTrigger className="w-[80px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="mile">miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {customers.length > 0 && (
          <Card className="w-fit">
            <CardContent className="pt-2 pb-2 px-3">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] whitespace-nowrap">Total Demand</Label>
                <div className="text-sm font-semibold">
                  {customers.reduce((sum, c) => sum + c.demand, 0).toFixed(2)}{" "}
                  <span className="text-xs text-muted-foreground">units</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[600px]">
            <MapView
              customers={customers}
              dcs={dcs}
              distanceRangeStep={distanceRangeStep}
              distanceUnit={settings.distanceUnit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
