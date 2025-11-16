import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Package, TrendingUp } from 'lucide-react';

interface ModuleSelectorProps {
  onSelect: (module: 'gfa' | 'inventory' | 'forecasting') => void;
}

export const ModuleSelector = ({ onSelect }: ModuleSelectorProps) => {
  const modules = [
    { 
      value: 'gfa' as const, 
      label: 'Greenfield Analysis',
      icon: MapPin,
      description: 'Customer, Product, Demand, Location data',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      value: 'inventory' as const, 
      label: 'Inventory Optimization',
      icon: Package,
      description: 'SKU, Stock levels, Lead times, Demand',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      value: 'forecasting' as const, 
      label: 'Demand Forecasting',
      icon: TrendingUp,
      description: 'Historical demand, Time series, Seasonality',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Target Module</CardTitle>
        <CardDescription>
          Choose which module you're preparing data for. This helps the AI understand your data structure requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Button
                key={module.value}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary"
                onClick={() => onSelect(module.value)}
              >
                <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-1">{module.label}</p>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
