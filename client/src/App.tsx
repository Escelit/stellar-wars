import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import WalletProvider from '@/components/WalletProvider';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MintPage = lazy(() => import('@/pages/MintPage'));
const GamePage = lazy(() => import('@/pages/GamePage'));
const CommandersPage = lazy(() => import('@/pages/CommandersPage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
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
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </WalletProvider>
  );
}