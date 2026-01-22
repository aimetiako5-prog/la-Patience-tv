import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriberAuthProvider } from "@/hooks/useSubscriberAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Subscribers from "./pages/Subscribers";
import Support from "./pages/Support";
import Faq from "./pages/Faq";
import SubscriberLogin from "./pages/SubscriberLogin";
import SubscriberDashboard from "./pages/SubscriberDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriberAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Staff/Admin routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/subscribers" element={
                <ProtectedRoute>
                  <Subscribers />
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              } />
              <Route path="/faq" element={
                <ProtectedRoute>
                  <Faq />
                </ProtectedRoute>
              } />
              
              {/* Subscriber portal routes */}
              <Route path="/abonne" element={<SubscriberLogin />} />
              <Route path="/mon-compte" element={<SubscriberDashboard />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriberAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
