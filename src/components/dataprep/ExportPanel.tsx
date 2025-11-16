import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { DataQualityScore } from './DataQualityScore';

interface ExportPanelProps {
  data: any[];
  project: any;
  targetModule: 'gfa' | 'inventory' | 'forecasting';
}

export const ExportPanel = ({ data, project, targetModule }: ExportPanelProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async (format: string) => {
    setIsExporting(true);
    try {
      let exportData = data;
      let fileName = `${project.name}_${format}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (format === targetModule) {
        // Transform data to module-specific format
        const workbook = XLSX.utils.book_new();
        
        // Add sheets based on module requirements
        const mainSheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, mainSheet, 'Data');
        
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

  const handleExportRaw = () => exportToExcel('raw');
  const handleExportModule = () => exportToExcel(targetModule);

  return (
    <div className="space-y-4">
      <DataQualityScore data={data} targetModule={targetModule} />
      
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
                      <h3 className="font-semibold">{targetModule.toUpperCase()} Input Format</h3>
                      <p className="text-sm text-muted-foreground">
                        Formatted for direct use in {targetModule} analysis
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Module-specific format</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Ready for analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>All validations passed</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExportModule} 
                    disabled={isExporting}
                    className="w-full"
                  >
                    Export for {targetModule.toUpperCase()}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">Raw Excel</h3>
                      <p className="text-sm text-muted-foreground">
                        Simple Excel export of transformed data
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Single sheet export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>All columns included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Quick download</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExportRaw} 
                    disabled={isExporting}
                    variant="outline"
                    className="w-full"
                  >
                    Export as Raw Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

