import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, CheckCircle2, Play, Book, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sampleDataDescriptions, gfaIndustryExamples, forecastingIndustryExamples, inventoryIndustryExamples, IndustryExample } from "@/data/sampleData";

interface QuickStartDialogProps {
  module: 'gfa' | 'forecasting' | 'inventory';
  onLoadSampleData: (example?: IndustryExample) => void;
  trigger?: React.ReactNode;
}

export function QuickStartDialog({ module, onLoadSampleData, trigger }: QuickStartDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<IndustryExample | null>(null);
  const moduleData = sampleDataDescriptions[module];
  
  const examples = module === 'gfa' ? gfaIndustryExamples : 
                   module === 'forecasting' ? forecastingIndustryExamples : 
                   inventoryIndustryExamples;

  const handleLoadData = (example: IndustryExample) => {
    onLoadSampleData(example);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Rocket className="h-4 w-4" />
            Quick Start Tutorial
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Rocket className="h-6 w-6 text-primary" />
            {moduleData.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {moduleData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Industry Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Choose an Industry Example
            </h3>
            <div className="grid gap-3">
              {examples.map((example) => (
                <Card 
                  key={example.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleLoadData(example)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{example.title}</CardTitle>
                        <Badge variant="secondary" className="mt-2">{example.industry}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                    <ul className="space-y-1">
                      {example.dataPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Quick Start Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5" />
                Quick Start Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {moduleData.workflow.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </Badge>
                    <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Select any example above to load realistic sample data and start exploring
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
