import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Server } from "lucide-react";
import { railwayClient } from "@/lib/railwayClient";
import { toast } from "sonner";

export function BackendConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    latency?: number;
    timestamp?: string;
    error?: string;
  } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);

    try {
      const startTime = Date.now();
      const health = await railwayClient.checkHealth();
      const latency = Date.now() - startTime;

      if (health.status === 'disabled') {
        setStatus({
          connected: false,
          error: 'Render backend is not enabled. Set VITE_USE_RAILWAY_BACKEND=true in .env'
        });
        toast.error("Backend not enabled");
      } else if (health.status === 'error') {
        setStatus({
          connected: false,
          error: 'Failed to connect to Render backend. Check if the service is running.'
        });
        toast.error("Connection failed");
      } else {
        setStatus({
          connected: true,
          latency,
          timestamp: health.timestamp
        });
        toast.success(`Connected! Latency: ${latency}ms`);
      }
    } catch (error: any) {
      setStatus({
        connected: false,
        error: error.message || "Unknown error occurred"
      });
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
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
              <div className="text-sm text-destructive">
                <p className="font-medium">Error:</p>
                <p>{status.error}</p>
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
