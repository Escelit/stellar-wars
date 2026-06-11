import { Navigate, Outlet } from 'react-router-dom';
import { useStellarWallet } from '@/hooks/useStellarWallet';

export default function ProtectedRoute() {
  const { address, isConnecting } = useStellarWallet();

  if (isConnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stellar-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cosmic-600 border-t-transparent" />
      </div>
    );
  }

  if (!address) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
