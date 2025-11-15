import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Server, Zap } from "lucide-react";
import { railwayClient } from "@/lib/railwayClient";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BackendConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [testingOptimization, setTestingOptimization] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    latency?: number;
    timestamp?: string;
    error?: string;
    url?: string;
  } | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);

    const backendUrl = import.meta.env.VITE_RAILWAY_BACKEND_URL;
    const backendEnabled = import.meta.env.VITE_USE_RAILWAY_BACKEND;

    console.log('🔍 Testing backend connection...');
    console.log('Backend URL:', backendUrl);
    console.log('Backend Enabled:', backendEnabled);
    console.log('Expected URL:', 'https://nov9.onrender.com');

    try {
      const startTime = Date.now();
      
      // First, try direct fetch to see raw error
      console.log('📡 Attempting direct fetch to:', `${backendUrl}/health`);
      const directResponse = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      console.log('✅ Direct fetch status:', directResponse.status);
      const directData = await directResponse.json();
      console.log('✅ Direct fetch data:', directData);
      
      const health = await railwayClient.checkHealth();
      const latency = Date.now() - startTime;

      if (health.status === 'disabled') {
        setStatus({
          connected: false,
          url: backendUrl,
          error: 'Backend is not enabled. Set VITE_USE_RAILWAY_BACKEND=true in .env'
        });
        toast.error("Backend not enabled");
      } else {
        setStatus({
          connected: true,
          latency,
          timestamp: health.timestamp,
          url: backendUrl
        });
        toast.success(`Connected! Latency: ${latency}ms`);
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      setStatus({
        connected: false,
        url: backendUrl,
        error: `${error.name}: ${error.message}`
      });
      toast.error("Connection failed", {
        description: `${error.name}: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const testOptimization = async () => {
    if (!status?.connected) {
      toast.error("Please test connection first");
      return;
    }

    setTestingOptimization(true);
    setOptimizationResult(null);

    // Sample test data
    const sampleData = [
      {
        product: "Product A",
        demandMean: 100,
        demandStd: 20,
        demandDist: "normal",
        leadTimeMean: 5,
        leadTimeStd: 1,
        leadTimeDist: "normal",
        holdingCost: 2,
        orderCost: 50,
        backorderCost: 10,
        initialInventory: 150
      }
    ];

    const config = {
      numDays: 365,
      numReplications: 100,
      serviceLevel: 0.95,
      policies: ["(s,S)", "(R,S)"]
    };

    try {
      const startTime = Date.now();
      const result = await railwayClient.optimizeInventory(sampleData, config);
      const computeTime = Date.now() - startTime;

      setOptimizationResult({
        data: result,
        computeTime
      });

      toast.success(`Optimization completed in ${(computeTime / 1000).toFixed(2)}s`, {
        description: "Backend is working correctly!"
      });
    } catch (error: any) {
      toast.error("Optimization test failed", {
        description: error.message
      });
      setOptimizationResult({
        error: error.message
      });
    } finally {
      setTestingOptimization(false);
    }
  };

  const isEnabled = railwayClient.isEnabled();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Render Backend Status
        </CardTitle>
        <CardDescription>
          Test connection to your high-performance computation backend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Backend:</span>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Button
            onClick={testConnection}
            disabled={testing || !isEnabled}
            size="sm"
          >
            {testing ? "Testing..." : "Test Connection"}
          </Button>
        </div>

        {status && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {status.connected ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {status.connected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {status.connected && status.latency && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Latency: {status.latency}ms</span>
              </div>
            )}

            {status.error && (
              <div className="text-sm text-destructive space-y-2">
                <p className="font-medium">Error:</p>
                <p className="break-all">{status.error}</p>
                {status.url && (
                  <p className="text-xs">Trying to connect to: {status.url}</p>
                )}
                <div className="mt-3 p-3 bg-muted rounded text-xs text-foreground space-y-2">
                  <p className="font-medium">Debug Info:</p>
                  <div className="space-y-1 font-mono text-xs">
                    <p>URL: {status.url}</p>
                    <p>Enabled: {import.meta.env.VITE_USE_RAILWAY_BACKEND}</p>
                    <p>Frontend: {window.location.origin}</p>
                  </div>
                  
                  <p className="font-medium mt-3">Troubleshooting:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open browser console (F12) to see detailed logs</li>
                    <li>Visit {status.url}/health directly in browser</li>
                    <li>Check if CORS headers include your frontend origin</li>
                    <li>Verify Render service is not sleeping (free tier)</li>
                    <li>Check Render dashboard for any deployment errors</li>
                  </ol>
                </div>
              </div>
            )}

            {!isEnabled && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">How to enable:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Set VITE_USE_RAILWAY_BACKEND=true in .env</li>
                  <li>Set VITE_RAILWAY_BACKEND_URL to your Render URL</li>
                  <li>Refresh the application</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {isEnabled && (
          <div className="text-xs text-muted-foreground">
            Using backend: {import.meta.env.VITE_RAILWAY_BACKEND_URL}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
