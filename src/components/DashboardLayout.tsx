import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function DashboardLayout() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        
        {/* Floating control panel - lower right */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg px-3 py-2">
          <SidebarTrigger className="h-8 w-8" />
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-medium truncate max-w-[150px]">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-8 px-2">
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </SidebarProvider>
  );
}