import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueueProvider } from "@/contexts/QueueContext";
import { BottomNav } from "@/components/BottomNav";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import MyTickets from "./pages/MyTickets";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/NotificationsPage";
import PrivacyPage from "./pages/PrivacyPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import AppSettingsPage from "./pages/AppSettingsPage";
import QRScannerPage from "./pages/QRScannerPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminQRCodes from "./pages/admin/AdminQRCodes";

const queryClient = new QueryClient();

// Component to conditionally render bottom nav
const AppLayout = () => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/notifications', '/privacy', '/help', '/settings', '/scan', '/admin'];
  const showNav = !hideNavPaths.some(path => location.pathname.startsWith(path));

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative shadow-xl">
      <Routes>
        {/* User Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/locations" element={
          <AdminRoute>
            <AdminLocations />
          </AdminRoute>
        } />
        <Route path="/admin/qrcodes" element={
          <AdminRoute>
            <AdminQRCodes />
          </AdminRoute>
        } />

        {/* User Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <MapView />
          </ProtectedRoute>
        } />
        <Route path="/scan" element={
          <ProtectedRoute>
            <QRScannerPage />
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />
        <Route path="/privacy" element={
          <ProtectedRoute>
            <PrivacyPage />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <HelpSupportPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && (
        <>
          <BottomNav />
          <DemoModeToggle />
        </>
      )}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <QueueProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </QueueProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
