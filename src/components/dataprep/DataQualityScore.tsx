import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Users, Package as PackageIcon, MapPin, TrendingUp } from 'lucide-react';

interface DataQualityScoreProps {
  data: any[];
  targetModule: 'gfa' | 'inventory' | 'forecasting';
}

export const DataQualityScore = ({ data, targetModule }: DataQualityScoreProps) => {
  const analyzeDataQuality = () => {
    if (!data || data.length === 0) return { score: 0, issues: [], stats: {} };

    const requiredFields = {
      gfa: ['customer', 'product', 'demand', 'location'],
      inventory: ['sku', 'stock', 'leadtime', 'demand'],
      forecasting: ['date', 'product', 'demand']
    }[targetModule];

    const issues: string[] = [];
    const stats: any = {};

    // Check for missing fields
    const columns = Object.keys(data[0] || {});
    const missingFields = requiredFields.filter(field => 
      !columns.some(col => col.toLowerCase().includes(field.toLowerCase()))
    );

    if (missingFields.length > 0) {
      issues.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check for empty values
    requiredFields.forEach(field => {
      const matchingCol = columns.find(col => col.toLowerCase().includes(field.toLowerCase()));
      if (matchingCol) {
        const emptyCount = data.filter(row => !row[matchingCol] || row[matchingCol] === '').length;
        const emptyPercent = (emptyCount / data.length) * 100;
        
        if (emptyPercent > 0) {
          issues.push(`${emptyCount} rows (${emptyPercent.toFixed(1)}%) have empty ${field}`);
        }
      }
    });

    // Calculate stats
    stats.totalRows = data.length;
    stats.totalColumns = columns.length;
    
    if (targetModule === 'gfa') {
      const customerCol = columns.find(c => c.toLowerCase().includes('customer'));
      const productCol = columns.find(c => c.toLowerCase().includes('product'));
      const demandCol = columns.find(c => c.toLowerCase().includes('demand'));
      
      if (customerCol) stats.uniqueCustomers = new Set(data.map(r => r[customerCol])).size;
      if (productCol) stats.uniqueProducts = new Set(data.map(r => r[productCol])).size;
      if (demandCol) {
        const totalDemand = data.reduce((sum, r) => sum + (parseFloat(r[demandCol]) || 0), 0);
        stats.totalDemand = totalDemand.toFixed(2);
      }
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    return { score, issues, stats };
  };

  const { score, issues, stats } = analyzeDataQuality();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-500';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Quality Score</span>
            <Badge className={getScoreBadge(score)}>
              {score}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Rows</p>
              <p className="text-2xl font-bold">{stats.totalRows || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Columns</p>
              <p className="text-2xl font-bold">{stats.totalColumns || 0}</p>
            </div>
            {stats.uniqueCustomers && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Unique Customers
                </p>
                <p className="text-2xl font-bold">{stats.uniqueCustomers}</p>
              </div>
            )}
            {stats.uniqueProducts && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <PackageIcon className="h-3 w-3" />
                  Unique Products
                </p>
                <p className="text-2xl font-bold">{stats.uniqueProducts}</p>
              </div>
            )}
            {stats.totalDemand && (
              <div className="space-y-1 col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Total Demand
                </p>
                <p className="text-2xl font-bold">{stats.totalDemand}</p>
              </div>
            )}
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Data Quality Issues:</p>
              {issues.map((issue, idx) => (
                <Alert key={idx} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {issues.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                All required fields are present and properly filled!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
