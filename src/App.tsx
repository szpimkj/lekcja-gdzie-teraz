import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import ClassSelector from "./pages/ClassSelector";
import Settings from "./pages/Settings";
import TodayPlan from "./pages/TodayPlan";
import WeekPlan from "./pages/WeekPlan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const basename = import.meta.env.PROD ? '/lekcja-gdzie-teraz' : '';

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<ClassSelector />} />
            <Route path="/now" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/today" element={<TodayPlan />} />
            <Route path="/week" element={<WeekPlan />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
