import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, CheckCircle2, Play, Book } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sampleDataDescriptions } from "@/data/sampleData";

interface QuickStartDialogProps {
  module: 'gfa' | 'forecasting' | 'inventory';
  onLoadSampleData: () => void;
  trigger?: React.ReactNode;
}

export function QuickStartDialog({ module, onLoadSampleData, trigger }: QuickStartDialogProps) {
  const [open, setOpen] = useState(false);
  const moduleData = sampleDataDescriptions[module];

  const handleLoadData = () => {
    onLoadSampleData();
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
          {/* What's Included Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Book className="h-5 w-5" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {moduleData.dataPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Quick Start Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5" />
                Quick Start Workflow
              </CardTitle>
              <CardDescription>
                Follow these steps to try the tool with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleLoadData} size="lg" className="flex-1 gap-2">
              <Rocket className="h-4 w-4" />
              Load Sample Data & Start
            </Button>
            <Button variant="outline" size="lg" onClick={() => setOpen(false)} className="flex-1">
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can load sample data anytime to explore features without preparing your own dataset
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
