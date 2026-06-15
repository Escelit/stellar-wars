import app from './app';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STELLAR_NETWORK',
] as const;

for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET === 'change-me-to-a-random-secret') {
  console.warn('WARNING: JWT_SECRET is set to the default value. Generate a random secret for production.');
}

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
