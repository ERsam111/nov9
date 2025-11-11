import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, Network, Gauge, Plus, Truck, BookOpen, Sparkles, Bot, Brain } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { useState } from 'react';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';
import { CaseStudiesDialog } from '@/components/CaseStudiesDialog';
const tools = [{
  icon: MapPin,
  title: 'GFA',
  description: 'Green Field Analysis',
  route: '/gfa',
  type: 'gfa' as const,
  color: 'gfa',
  gradient: 'var(--gradient-gfa)',
  aiFeature: 'Interactive assistant & smart insights'
}, {
  icon: TrendingUp,
  title: 'Demand Forecasting',
  description: 'Predictive Analytics',
  route: '/demand-forecasting',
  type: 'forecasting' as const,
  color: 'forecasting',
  gradient: 'var(--gradient-forecasting)',
  aiFeature: 'Automated forecasting'
}, {
  icon: Network,
  title: 'Network Analysis',
  description: 'JCG Supply Chain Optimization',
  route: '/network',
  type: 'network' as const,
  color: 'network',
  gradient: 'var(--gradient-network)',
  comingSoon: true,
  aiFeature: 'Intelligent optimization'
}, {
  icon: Gauge,
  title: 'Inventory Optimization',
  description: 'Monte Carlo Optimization',
  route: '/inventory-optimization-v2',
  type: 'inventory' as const,
  color: 'inventory',
  gradient: 'var(--gradient-inventory)',
  aiFeature: 'Smart recommendations'
}, {
  icon: Truck,
  title: 'Transportation Optimization',
  description: 'Route & Load Planning',
  route: '/transportation',
  type: 'transportation' as const,
  color: 'transport',
  gradient: 'var(--gradient-transport)',
  comingSoon: true,
  aiFeature: 'Intelligent routing'
}];
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    projects
  } = useProjects();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [caseStudiesOpen, setCaseStudiesOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<typeof tools[0] | null>(null);
  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.comingSoon) return;
    setSelectedTool(tool);
    setCreateDialogOpen(true);
  };
  return <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-gfa/5 via-forecasting/5 to-inventory/5" />
        <div className="relative px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gfa via-forecasting to-inventory bg-clip-text text-transparent">
                  JCG Supply Chain Optimization
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-powered tools for supply chain management
                </p>
              </div>
              <Button onClick={() => setCaseStudiesOpen(true)} variant="outline" size="sm" className="hover:border-gfa">
                <BookOpen className="h-4 w-4 mr-2" />
                Guides
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="px-4 py-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {tools.map((tool, index) => {
          const Icon = tool.icon;
          return <Card key={tool.title} className={`group relative overflow-hidden transition-all duration-300 ${tool.comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'}`} onClick={() => handleToolClick(tool)}>
                {!tool.comingSoon && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
              background: `linear-gradient(135deg, hsl(var(--${tool.color}) / 0.1), transparent)`
            }} />}
                
                <CardHeader className="relative z-10 p-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tool.comingSoon ? 'bg-muted' : 'group-hover:scale-110'} transition-all`} style={!tool.comingSoon ? {
                  background: tool.gradient,
                  opacity: 0.2
                } : undefined}>
                      <Icon className={`h-4 w-4 ${tool.comingSoon ? 'text-muted-foreground' : ''}`} style={!tool.comingSoon ? {
                    color: `hsl(var(--${tool.color}))`
                  } : undefined} />
                    </div>
                    {tool.comingSoon && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                        Soon
                      </span>}
                  </div>
                  
                  <CardTitle className="text-sm mb-1">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-1">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10 p-3 pt-0">
                  <Button variant={tool.comingSoon ? "ghost" : "default"} size="sm" className="w-full h-7 text-xs" style={!tool.comingSoon ? {
                background: tool.gradient
              } : undefined} disabled={tool.comingSoon}>
                    <Plus className="h-3 w-3 mr-1" />
                    {tool.comingSoon ? 'Soon' : 'Create'}
                  </Button>
                </CardContent>
              </Card>;
        })}
        </div>
      </div>

      {selectedTool && <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} toolType={selectedTool.type} toolName={selectedTool.title} redirectTo={selectedTool.route} />}
      
      <CaseStudiesDialog open={caseStudiesOpen} onOpenChange={setCaseStudiesOpen} />
    </div>;
};
export default Dashboard;