import { Routes, Route } from 'react-router-dom';
import WalletProvider from '@/components/WalletProvider';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import MintPage from '@/pages/MintPage';
import GamePage from '@/pages/GamePage';
import CommandersPage from '@/pages/CommandersPage';
import MarketplacePage from '@/pages/MarketplacePage';
import ProfilePage from '@/pages/ProfilePage';

export default function App() {
  return (
    <WalletProvider>
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
    </WalletProvider>
  );
}
