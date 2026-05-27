/**
 * Sets environment variables needed for integration tests BEFORE any modules load.
 * This file runs via jest "setupFiles" — before the test framework and before any imports.
 */
import { generateKeyPairSync } from 'crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.JWT_PRIVATE_KEY = privateKey;
process.env.JWT_PUBLIC_KEY = publicKey;
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://localhost:5432/vantage_test_placeholder';
process.env.RESEND_API_KEY = 're_test_placeholder_key';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.EMAIL_FROM = 'test@vantage.app';
process.env.NODE_ENV = 'test';
