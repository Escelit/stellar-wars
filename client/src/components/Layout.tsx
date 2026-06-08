import { Outlet, Link, NavLink } from 'react-router-dom';
import WalletButton from './WalletButton';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/mint', label: 'Mint' },
  { to: '/game', label: 'Campaign' },
  { to: '/commanders', label: 'Commanders' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-stellar-700 bg-stellar-800 p-4">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="text-2xl">⚔️</span>
          <span className="text-lg font-bold text-stellar-100">Stellar Wars</span>
        </Link>

        <div className="mb-6 border-b border-stellar-700 pb-4">
          <WalletButton />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cosmic-600 text-white'
                    : 'text-stellar-300 hover:bg-stellar-700 hover:text-stellar-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
