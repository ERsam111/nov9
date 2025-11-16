import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { analyzeExcelStructure } from '@/utils/excelAnalyzer';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface DataUploadPanelProps {
  onDataUpload: (data: any[]) => void;
  project: any;
}

export const DataUploadPanel = ({ onDataUpload, project }: DataUploadPanelProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      // Analyze file structure
      const structure = await analyzeExcelStructure(file);
      setFileInfo(structure);

      // Read the first sheet's data
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        onDataUpload(jsonData);
        toast.success(`Loaded ${jsonData.length} rows from ${file.name}`);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast.error('Failed to analyze file structure');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Raw Data
        </CardTitle>
        <CardDescription>
          Upload your Excel file with raw data. The system will analyze its structure and prepare it for transformation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your Excel file here, or click to browse
          </p>
          <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
            Select File
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {fileInfo && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold">File Structure</h3>
            {fileInfo.sheets.map((sheet: any, idx: number) => (
              <div key={idx} className="text-sm">
                <p className="font-medium">{sheet.sheetName}</p>
                <p className="text-muted-foreground">
                  {sheet.rowCount} rows, {sheet.columns.length} columns
                </p>
                <p className="text-xs text-muted-foreground">
                  Columns: {sheet.columns.join(', ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
