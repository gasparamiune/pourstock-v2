import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { CookieBanner } from "@/components/auth/CookieBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import Health from "./pages/Health";
import Join from "./pages/Join";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Dashboard from "./pages/Dashboard";
import Updates from "./pages/Updates";
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
import Kitchen from "./pages/Kitchen";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <CookieBanner />
              <Routes>
                <Route path="/health" element={<Health />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/join" element={<Join />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/import" element={<Import />} />
                          <Route path="/table-plan" element={<TablePlan />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/reception" element={<ProtectedRoute requireDepartment="reception"><Reception /></ProtectedRoute>} />
                          <Route path="/housekeeping" element={<ProtectedRoute requireDepartment="housekeeping"><Housekeeping /></ProtectedRoute>} />
                          <Route path="/kitchen" element={<ProtectedRoute requireDepartment="kitchen"><Kitchen /></ProtectedRoute>} />
                          <Route path="/user-management" element={<ProtectedRoute requireManager={true}><UserManagement /></ProtectedRoute>} />
                          <Route path="/settings" element={<ProtectedRoute requireAdmin={true}><Settings /></ProtectedRoute>} />
                          <Route path="/updates" element={<Updates />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        </ErrorBoundary>
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
</ThemeProvider>
);

export default App;
