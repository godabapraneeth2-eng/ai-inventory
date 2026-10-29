import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/common/CommandPalette';
import { LiveNotifications } from './components/common/LiveNotifications';

// ── Lazy-loaded screens ──
const Dashboard = lazy(() => import('./screens/Dashboard').then(m => ({ default: m.Dashboard })));
const OrdersScreen = lazy(() => import('./screens/OrdersScreen').then(m => ({ default: m.OrdersScreen })));
const InventoryScreen = lazy(() => import('./screens/InventoryScreen').then(m => ({ default: m.InventoryScreen })));
const RiskCenterScreen = lazy(() => import('./screens/RiskCenterScreen').then(m => ({ default: m.RiskCenterScreen })));
const AuditTrailScreen = lazy(() => import('./screens/AuditTrailScreen').then(m => ({ default: m.AuditTrailScreen })));
const AIAssistantScreen = lazy(() => import('./screens/AIAssistantScreen').then(m => ({ default: m.AIAssistantScreen })));
const ReturnsScreen = lazy(() => import('./screens/ReturnsScreen').then(m => ({ default: m.ReturnsScreen })));
const FraudScreen = lazy(() => import('./screens/FraudScreen').then(m => ({ default: m.FraudScreen })));
const ProcurementScreen = lazy(() => import('./screens/ProcurementScreen').then(m => ({ default: m.ProcurementScreen })));
const ShippingScreen = lazy(() => import('./screens/ShippingScreen').then(m => ({ default: m.ShippingScreen })));
const ExecutiveScreen = lazy(() => import('./screens/ExecutiveScreen').then(m => ({ default: m.ExecutiveScreen })));
const QualityScreen = lazy(() => import('./screens/QualityScreen').then(m => ({ default: m.QualityScreen })));
const ApprovalsScreen = lazy(() => import('./screens/ApprovalsScreen').then(m => ({ default: m.ApprovalsScreen })));
const ObservabilityScreen = lazy(() => import('./screens/ObservabilityScreen').then(m => ({ default: m.ObservabilityScreen })));
const LoginScreen = lazy(() => import('./screens/LoginScreen').then(m => ({ default: m.LoginScreen })));

// ── Loading spinner ──
function LoadingScreen() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-xs text-muted">Loading module...</p>
      </div>
    </div>
  );
}

// ── Authenticated layout ──
function AppLayout() {
  const { sidebarOpen, setSidebarOpen, darkMode } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen bg-app">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="min-w-0 flex-1">
          <Topbar />
          <main className="mx-auto max-w-[1440px] p-5 lg:p-8">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Workspace */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<OrdersScreen />} />
                <Route path="/inventory" element={<InventoryScreen />} />
                {/* Intelligence */}
                <Route path="/risk" element={<RiskCenterScreen />} />
                <Route path="/audit" element={<AuditTrailScreen />} />
                <Route path="/assistant" element={<AIAssistantScreen />} />
                {/* Operations */}
                <Route path="/returns" element={<ReturnsScreen />} />
                <Route path="/shipping" element={<ShippingScreen />} />
                <Route path="/procurement" element={<ProcurementScreen />} />
                <Route path="/quality" element={<QualityScreen />} />
                {/* Security */}
                <Route path="/fraud" element={<FraudScreen />} />
                <Route path="/approvals" element={<ApprovalsScreen />} />
                {/* Analytics */}
                <Route path="/executive" element={<ExecutiveScreen />} />
                <Route path="/observability" element={<ObservabilityScreen />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
      <CommandPalette />
      <LiveNotifications />
    </div>
  );
}

// ── Root App ──
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Suspense fallback={<LoadingScreen />}><LoginScreen /></Suspense>} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
