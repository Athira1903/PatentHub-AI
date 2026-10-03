import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config({ path: 'd:/patent/server/.env' });
const secret = process.env.RAZORPAY_KEY_SECRET?.trim();

if (!secret || secret.length < 5) {
  console.log('No valid secret to check.');
  process.exit(0);
}

console.log('=== CHECKING SECRET LEAKAGE (SECRET LENGTH:', secret.length, ') ===');

// 1. Search in client/src
function searchDir(dir: string): string[] {
  let leaks: string[] = [];
  if (!fs.existsSync(dir)) return leaks;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        leaks = leaks.concat(searchDir(fullPath));
      }
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (secret && content.includes(secret)) {
          leaks.push(fullPath);
        }
      } catch {}
    }
  }
  return leaks;
}

const clientDir = path.resolve(__dirname, '../../../client/src');
const clientLeaks = searchDir(clientDir);
console.log('Secret leaks in client/src:   ', clientLeaks.length === 0 ? 'CLEAN (0)' : clientLeaks);

// 2. Search client/.env
const clientEnvPath = path.resolve(__dirname, '../../../client/.env');
if (fs.existsSync(clientEnvPath)) {
  const content = fs.readFileSync(clientEnvPath, 'utf8');
  console.log('Secret in client/.env:        ', content.includes(secret) ? 'LEAKED' : 'CLEAN');
} else {
  console.log('client/.env exists:            false (CLEAN)');
}

// 3. Search client/dist
const distLeaks = searchDir('d:/patent/client/dist');
console.log('Secret leaks in Vite bundle:   ', distLeaks.length === 0 ? 'CLEAN (0)' : distLeaks);

// 4. Search git tracked files
try {
  const gitFiles = execSync('git ls-files', { cwd: 'd:/patent' }).toString().split('\n').filter(Boolean);
  const gitLeaks: string[] = [];
  for (const f of gitFiles) {
    const full = path.join('d:/patent', f);
    if (fs.existsSync(full)) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes(secret)) {
          gitLeaks.push(f);
        }
      } catch {}
    }
  }
  console.log('Secret in Git tracked files:  ', gitLeaks.length === 0 ? 'CLEAN (0)' : gitLeaks);
} catch (err: any) {
  console.log('Git check warning:', err.message);
}
