import { Toaster } from "sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import FacultyPage from "@/pages/FacultyPage";
import RoomsPage from "@/pages/RoomsPage";
import SubjectsPage from "@/pages/SubjectsPage";
import TimeSlotsPage from "@/pages/TimeSlotsPage";
import TimetablePage from "@/pages/TimetablePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/timeslots" element={<TimeSlotsPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
