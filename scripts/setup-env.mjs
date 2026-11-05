// Creates local env files for development. Existing files are never overwritten.
import { generateKeyPairSync } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const apiEnv = 'apps/api/.env';
const webEnv = 'apps/web/.env.local';

if (existsSync(apiEnv)) {
  console.log(`${apiEnv} already exists, leaving it alone`);
} else {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const oneLine = (pem) => pem.trim().replace(/\r?\n/g, '\\n');
  const env = readFileSync('apps/api/.env.example', 'utf8')
    .replace(/^JWT_PRIVATE_KEY=.*$/m, () => `JWT_PRIVATE_KEY="${oneLine(privateKey)}"`)
    .replace(/^JWT_PUBLIC_KEY=.*$/m, () => `JWT_PUBLIC_KEY="${oneLine(publicKey)}"`);
  writeFileSync(apiEnv, env);
  console.log(`Created ${apiEnv} with a new JWT key pair`);
}

if (existsSync(webEnv)) {
  console.log(`${webEnv} already exists, leaving it alone`);
} else {
  copyFileSync('apps/web/.env.example', webEnv);
  console.log(`Created ${webEnv}`);
}
