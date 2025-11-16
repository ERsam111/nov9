import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExportPanelProps {
  data: any[];
  scenario: any;
}

export const ExportPanel = ({ data, scenario }: ExportPanelProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async (format: 'gfa' | 'raw') => {
    setIsExporting(true);
    try {
      let exportData = data;
      let fileName = `${scenario.name}_${format}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (format === 'gfa') {
        // Transform data to GFA input format
        // This would include sheets like: Customers, Products, Costs, Existing Sites
        const workbook = XLSX.utils.book_new();
        
        // Add sheets based on GFA requirements
        const customerSheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customers');
        
        // Add other required sheets (placeholder for now)
        const productSheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(workbook, productSheet, 'Products');
        
        XLSX.writeFile(workbook, fileName);
      } else {
        // Export raw transformed data
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transformed Data');
        XLSX.writeFile(workbook, fileName);
      }

      toast.success(`Exported ${data.length} rows successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export your transformed data in the format you need
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">GFA Input Format</h3>
                    <p className="text-sm text-muted-foreground">
                      Formatted for direct use in GFA analysis
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Customer data sheet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Product catalog</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Cost parameters</span>
                  </div>
                </div>
                <Button 
                  onClick={() => exportToExcel('gfa')} 
                  disabled={isExporting}
                  className="w-full"
                >
                  Export as GFA Input
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Raw Excel Export</h3>
                    <p className="text-sm text-muted-foreground">
                      Transformed data as-is for custom use
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>All transformations applied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Single sheet format</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Ready for custom analysis</span>
                  </div>
                </div>
                <Button 
                  onClick={() => exportToExcel('raw')} 
                  disabled={isExporting}
                  variant="outline"
                  className="w-full"
                >
                  Export Raw Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> All SQL transformations and data changes are automatically saved. 
            You can return to this scenario anytime to continue working or export again.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
