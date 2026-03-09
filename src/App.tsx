import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Import from "./pages/Import";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import TablePlan from "./pages/TablePlan";
import UserManagement from "./pages/UserManagement";
import Reception from "./pages/Reception";
import Housekeeping from "./pages/Housekeeping";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/import" element={<Import />} />
                          <Route path="/table-plan" element={<TablePlan />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/reception" element={<ProtectedRoute requireDepartment="reception"><Reception /></ProtectedRoute>} />
                          <Route path="/housekeeping" element={<ProtectedRoute requireDepartment="housekeeping"><Housekeeping /></ProtectedRoute>} />
                          <Route path="/user-management" element={<ProtectedRoute requireManager={true}><UserManagement /></ProtectedRoute>} />
                          <Route path="/settings" element={<ProtectedRoute requireAdmin={true}><Settings /></ProtectedRoute>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
