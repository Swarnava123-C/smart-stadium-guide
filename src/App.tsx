import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StadiumProvider } from "@/contexts/StadiumContext";
import { AppLayout } from "@/components/AppLayout";
import { IndiaMapPage } from "@/pages/IndiaMapPage";
import { StadiumDashboardPage } from "@/pages/StadiumDashboardPage";
import { AIAssistantPage } from "@/pages/AssistantPage";
import { StadiumMapPage } from "@/pages/MapPage";
import { AdminPage } from "@/pages/AdminPage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { NationalCommandPage } from "@/pages/NationalCommandPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <StadiumProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<IndiaMapPage />} />
              <Route path="/stadium/:id" element={<StadiumDashboardPage />} />
              <Route path="/assistant" element={<AIAssistantPage />} />
              <Route path="/venue-map" element={<StadiumMapPage />} />
              <Route path="/venue-map/:id" element={<StadiumMapPage />} />
              <Route path="/event/:eventId" element={<EventDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/national" element={<NationalCommandPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </StadiumProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
