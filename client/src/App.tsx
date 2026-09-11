import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, ProtectedRoute, WalletProvider } from '@/components';
import { LoadingSpinner } from '@/components/ui';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MintPage = lazy(() => import('@/pages/MintPage'));
const GamePage = lazy(() => import('@/pages/GamePage'));
const CommandersPage = lazy(() => import('@/pages/CommandersPage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
const BattlePage = lazy(() => import('@/pages/BattlePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

export default function App() {
  return (
    <WalletProvider>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/mint" element={<MintPage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/commanders" element={<CommandersPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/battle" element={<BattlePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </WalletProvider>
  );
}