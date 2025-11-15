import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ChevronLeft, Table2, Search, Settings, Info, Edit2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DataHandlingGuide } from "./DataHandlingGuide";

interface GFASidebarNavProps {
  activeTable: string;
  onTableSelect: (table: string) => void;
  customerCount: number;
  productCount: number;
  existingSiteCount: number;
}

const SECTIONS = [
  {
    id: "data",
    label: "Input Data",
    items: [
      { id: "customers", label: "Customers & Demand" },
      { id: "products", label: "Products" },
      { id: "existing-sites", label: "Existing Sites" },
    ],
  },
  {
    id: "settings",
    label: "Configuration",
    items: [{ id: "costs", label: "Cost Parameters" }],
  },
];

export function GFASidebarNav({ activeTable, onTableSelect, customerCount, productCount, existingSiteCount }: GFASidebarNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["data", "settings"]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getCounts = (itemId: string) => {
    if (itemId === "customers") return customerCount;
    if (itemId === "products") return productCount;
    if (itemId === "existing-sites") return existingSiteCount;
    return 0;
  };

  const filteredSections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      searchQuery ? item.label.toLowerCase().includes(searchQuery.toLowerCase()) : true,
    ),
  })).filter((section) => section.items.length > 0);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    );
  };

  if (isCollapsed) {
    return (
      <Card className="w-14 flex flex-col h-full shrink-0">
        <div className="flex-1 flex flex-col items-center gap-3 p-2">
          <button
            onClick={() => onTableSelect("customers")}
            className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center hover:bg-accent relative",
              activeTable === "customers" && "bg-primary/10 text-primary"
            )}
            title="Customers"
          >
            <Table2 className="h-4 w-4" />
            {customerCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                {customerCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTableSelect("products")}
            className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center hover:bg-accent relative",
              activeTable === "products" && "bg-primary/10 text-primary"
            )}
            title="Products"
          >
            <Edit2 className="h-4 w-4" />
            {productCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                {productCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTableSelect("existing-sites")}
            className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center hover:bg-accent relative",
              activeTable === "existing-sites" && "bg-primary/10 text-primary"
            )}
            title="Existing Sites"
          >
            <GripVertical className="h-4 w-4" />
            {existingSiteCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                {existingSiteCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTableSelect("costs")}
            className={cn(
              "w-10 h-10 rounded-md flex items-center justify-center hover:bg-accent",
              activeTable === "costs" && "bg-primary/10 text-primary"
            )}
            title="Cost Parameters"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <div className="p-2 border-t">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full h-9 rounded-md hover:bg-accent flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-80 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Table2 className="h-5 w-5" />
          GFA Setup
        </h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredSections.map((section) => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm font-medium"
            >
              {expandedSections.includes(section.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {section.id === "settings" ? (
                <Settings className="h-4 w-4 text-primary" />
              ) : (
                <Table2 className="h-4 w-4 text-primary" />
              )}
              {section.label}
            </button>

            {expandedSections.includes(section.id) && section.items.length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {section.items.map((item) => {
                  const count = getCounts(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTableSelect(item.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-accent",
                        activeTable === item.id && "bg-primary/10 text-primary font-medium",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {item.id === "costs" ? <Settings className="h-3 w-3" /> : <Table2 className="h-3 w-3" />}
                        {item.label}
                      </span>
                      {item.id !== "costs" && (
                        <span
                          className={cn("text-xs px-2 py-0.5 rounded-full", count > 0 ? "bg-muted" : "bg-muted/60")}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Handling Guide */}
      <div className="p-2 border-t">
        <Collapsible>
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md text-sm font-medium">
            <Info className="h-4 w-4 text-primary" />
            Data Handling Tips
            <ChevronDown className="h-4 w-4 ml-auto" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 px-3">
            <div className="text-xs space-y-2 text-muted-foreground">
              <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Click</kbd> column name to bulk edit</p>
              <p>Drag <GripVertical className="h-3 w-3 inline" /> to reorder columns</p>
              <p>Drag column edges to resize widths</p>
              <p>Use width presets for quick layouts</p>
              <p>Headers stay visible when scrolling</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Collapse Button at Bottom */}
      <div className="p-2 border-t">
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-full h-9 rounded-md hover:bg-accent flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          title="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
          Collapse
        </button>
      </div>
    </Card>
  );
}
