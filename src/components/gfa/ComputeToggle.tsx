import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Cloud, MonitorSmartphone } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ComputeToggleProps {
  useCloud: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

export function ComputeToggle({ useCloud, onToggle, disabled }: ComputeToggleProps) {
  return (
    <Card className="p-4 bg-muted/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {useCloud ? (
            <Cloud className="h-5 w-5 text-primary" />
          ) : (
            <MonitorSmartphone className="h-5 w-5 text-secondary" />
          )}
          <div>
            <Label htmlFor="gfa-compute-mode" className="font-semibold">
              {useCloud ? "Cloud Computing" : "Local Computing"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {useCloud 
                ? "Using Render backend for optimization" 
                : "Running optimization locally in browser"}
            </p>
          </div>
        </div>
        <Switch
          id="gfa-compute-mode"
          checked={useCloud}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
      </div>
    </Card>
  );
}
