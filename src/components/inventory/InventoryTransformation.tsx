import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Play, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransformationPlan {
  description: string;
  operations: Array<{ type: string; details: string }>;
  affectedData: string[];
}

interface InventoryTransformationProps {
  inputData: any;
  onDataUpdate?: (updatedData: any) => void;
  model: string;
}

export function InventoryTransformation({ inputData, onDataUpdate, model }: InventoryTransformationProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transformationPlan, setTransformationPlan] = useState<TransformationPlan | null>(null);
  const [editableQuery, setEditableQuery] = useState("");
  const [showQueryEditor, setShowQueryEditor] = useState(false);

  const handleGeneratePlan = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inventory-data-support', {
        body: {
          question: input.trim(),
          action: 'generateTransformationPlan',
          model
        }
      });

      if (error) throw error;

      setTransformationPlan(data.plan);
      setEditableQuery(data.plan.operations.map((op: any) => op.details).join('\n'));
      setShowQueryEditor(true);
      toast.success("Transformation plan generated");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!transformationPlan) return;

    setIsLoading(true);
    try {
      const updatedPlan = {
        ...transformationPlan,
        operations: editableQuery.split('\n').filter(line => line.trim()).map(line => ({
          type: 'UPDATE',
          details: line.trim()
        }))
      };

      const { data, error } = await supabase.functions.invoke('inventory-data-support', {
        body: {
          action: 'executeTransformation',
          transformationPlan: updatedPlan,
          currentData: inputData
        }
      });

      if (error) throw error;

      if (onDataUpdate && data.updatedData) {
        onDataUpdate(data.updatedData);
        toast.success("Data transformed successfully");
        setTransformationPlan(null);
        setShowQueryEditor(false);
        setInput("");
        setEditableQuery("");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to execute transformation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Database className="h-4 w-4" />
          Transform Inventory Data
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          Modify your simulation input data using natural language or SQL UPDATE syntax
        </p>
        
        <div className="space-y-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: Increase customer demand by 30% or UPDATE customerData SET demand = demand * 1.3"
            className="min-h-[80px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleGeneratePlan}
            disabled={!input.trim() || isLoading}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? "Generating Plan..." : "Generate Transformation"}
          </Button>
        </div>
      </div>

      {showQueryEditor && transformationPlan && (
        <Alert className="border-primary/30 bg-primary/5">
          <Database className="h-4 w-4" />
          <AlertDescription className="mt-2 space-y-3">
            <div>
              <h4 className="font-semibold mb-2">Review & Edit Transformation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {transformationPlan.description}
              </p>
            </div>
            
            <div className="bg-background/80 border rounded-lg p-3 text-xs space-y-2">
              <p className="font-semibold text-primary text-sm">📋 Available Tables:</p>
              <p className="text-muted-foreground text-[10px]">
                customerData, facilityData, productData, customerFulfillmentData, replenishmentData, 
                productionData, inventoryPolicyData, warehousingData, orderFulfillmentData, 
                transportationData, transportationModeData, customerOrderData, bomData, settings
              </p>
              
              <div className="bg-muted/50 rounded p-2">
                <p className="font-semibold text-primary mb-1.5">💡 SQL UPDATE Examples:</p>
                <ul className="text-muted-foreground space-y-0.5 ml-2 font-mono text-[10px]">
                  <li>• UPDATE customerData SET demand = demand * 1.5</li>
                  <li>• UPDATE facilityData SET capacity = 10000 WHERE name = 'DC1'</li>
                  <li>• UPDATE productData SET cost = cost * 1.1</li>
                  <li>• UPDATE settings SET replications = 100</li>
                </ul>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold mb-2">Edit Operations (One per line):</p>
              <Textarea
                value={editableQuery}
                onChange={(e) => setEditableQuery(e.target.value)}
                className="font-mono text-xs min-h-[120px]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleExecute}
                disabled={isLoading || !editableQuery.trim()}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isLoading ? "Executing..." : "Apply Changes"}
              </Button>
              <Button
                onClick={() => {
                  setShowQueryEditor(false);
                  setTransformationPlan(null);
                  setEditableQuery("");
                }}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
