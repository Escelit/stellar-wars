import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-bold text-stellar-100">⚔️ Stellar Wars</h1>
        <p className="text-lg text-stellar-400">
          A branching narrative war game powered by the Stellar blockchain
        </p>
      </div>

      <div className="flex gap-4">
        <Link to="/mint" className="btn-primary">
          Mint Commander
        </Link>
        <Link to="/game" className="btn-secondary">
          Continue Campaign
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Commanders
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </div>
        <div className="card text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Battles
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </div>
        <div className="card text-center">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cosmic-400">
            Victories
          </h3>
          <p className="text-3xl font-bold text-stellar-100">0</p>
        </div>
      </div>
    </div>
  );
}
