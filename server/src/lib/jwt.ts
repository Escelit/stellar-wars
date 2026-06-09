import jwt from 'jsonwebtoken';

const JWT_SECRET = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

export interface JwtPayload {
  userId: string;
  stellarPubKey: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET()) as JwtPayload;
}

export function getChallenge(publicKey: string): string {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);
  return `Stellar Wars auth: ${publicKey}:${timestamp}:${nonce}`;
}
