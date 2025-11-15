import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, MousePointerClick, Keyboard, Trash2, CheckSquare, Edit2 } from "lucide-react";

export function DataHandlingGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Data Handling Guide
        </CardTitle>
        <CardDescription>
          Learn how to efficiently manage your data with bulk operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckSquare className="h-4 w-4" />
          <AlertDescription>
            <strong>Multi-Row Selection:</strong> Use the checkboxes to select multiple rows. Select all rows with the header checkbox.
          </AlertDescription>
        </Alert>

        <Alert>
          <MousePointerClick className="h-4 w-4" />
          <AlertDescription>
            <strong>Column Bulk Edit:</strong> Hold <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl</kbd> (or <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Cmd</kbd> on Mac) and click on any column header name to open the bulk editor instantly.
          </AlertDescription>
        </Alert>

        <Alert>
          <Keyboard className="h-4 w-4" />
          <AlertDescription>
            <strong>Column Resizing:</strong> Hover over the right edge of any column header and drag the resize handle to adjust column width. Your preferences are saved during the session.
          </AlertDescription>
        </Alert>

        <Alert>
          <Keyboard className="h-4 w-4" />
          <AlertDescription>
            <strong>Alternative Method:</strong> After Ctrl+clicking a column, you can also press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to open the bulk editor (if it didn't open automatically).
          </AlertDescription>
        </Alert>

        <Alert>
          <Trash2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Bulk Delete:</strong> Select multiple rows using checkboxes, then click the "Delete" button that appears to remove all selected rows at once.
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <p className="font-semibold">Quick Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Ctrl+Click any column header to instantly open bulk editor</li>
            <li>Drag column edges to resize - hover over the right edge of any column header</li>
            <li>Sr No column automatically shows row numbers for reference</li>
            <li>Bulk edit works for all column types including dropdowns</li>
            <li>You can clear an entire column using the "Clear All" button</li>
            <li>Number of lines entered should match the number of rows you want to update</li>
            <li>Use Export/Import for working with Excel files</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
