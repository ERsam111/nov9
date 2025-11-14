// Railway Backend Client
// Handles communication with Railway optimization service

const RAILWAY_URL = import.meta.env.VITE_RAILWAY_BACKEND_URL;
const USE_RAILWAY = import.meta.env.VITE_USE_RAILWAY_BACKEND === 'true';

interface RailwayResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class RailwayClient {
  private baseUrl: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = RAILWAY_URL || '';
    this.enabled = USE_RAILWAY && Boolean(this.baseUrl);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private async request<T>(endpoint: string, data: any): Promise<T> {
    if (!this.enabled) {
      throw new Error('Railway backend is not configured. Please set VITE_RAILWAY_BACKEND_URL in your environment variables.');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Railway request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async optimizeInventory(tableData: any, config: any) {
    return this.request('/api/optimize-inventory', { tableData, config });
  }

  async optimizeNetwork(data: any, settings: any) {
    return this.request('/api/optimize-network', { data, settings });
  }

  async optimizeGFA(data: any, settings: any) {
    return this.request('/api/optimize-gfa', { data, settings });
  }

  async forecastDemand(historicalData: any[], settings: any) {
    return this.request('/api/forecast-demand', { historicalData, settings });
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    if (!this.enabled) {
      return { status: 'disabled', timestamp: new Date().toISOString() };
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Railway health check failed:', error);
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
}

export const railwayClient = new RailwayClient();
