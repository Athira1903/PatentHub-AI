"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
dotenv_1.default.config({ path: 'd:/patent/server/.env' });
const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
if (!secret || secret.length < 5) {
    console.log('No valid secret to check.');
    process.exit(0);
}
console.log('=== CHECKING SECRET LEAKAGE (SECRET LENGTH:', secret.length, ') ===');
// 1. Search in client/src
function searchDir(dir) {
    let leaks = [];
    if (!fs_1.default.existsSync(dir))
        return leaks;
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== '.git') {
                leaks = leaks.concat(searchDir(fullPath));
            }
        }
        else if (entry.isFile()) {
            try {
                const content = fs_1.default.readFileSync(fullPath, 'utf8');
                if (secret && content.includes(secret)) {
                    leaks.push(fullPath);
                }
            }
            catch { }
        }
    }
    return leaks;
}
const clientDir = path_1.default.resolve(__dirname, '../../../client/src');
const clientLeaks = searchDir(clientDir);
console.log('Secret leaks in client/src:   ', clientLeaks.length === 0 ? 'CLEAN (0)' : clientLeaks);
// 2. Search client/.env
const clientEnvPath = path_1.default.resolve(__dirname, '../../../client/.env');
if (fs_1.default.existsSync(clientEnvPath)) {
    const content = fs_1.default.readFileSync(clientEnvPath, 'utf8');
    console.log('Secret in client/.env:        ', content.includes(secret) ? 'LEAKED' : 'CLEAN');
}
else {
    console.log('client/.env exists:            false (CLEAN)');
}
// 3. Search client/dist
const distLeaks = searchDir('d:/patent/client/dist');
console.log('Secret leaks in Vite bundle:   ', distLeaks.length === 0 ? 'CLEAN (0)' : distLeaks);
// 4. Search git tracked files
try {
    const gitFiles = (0, child_process_1.execSync)('git ls-files', { cwd: 'd:/patent' }).toString().split('\n').filter(Boolean);
    const gitLeaks = [];
    for (const f of gitFiles) {
        const full = path_1.default.join('d:/patent', f);
        if (fs_1.default.existsSync(full)) {
            try {
                const c = fs_1.default.readFileSync(full, 'utf8');
                if (c.includes(secret)) {
                    gitLeaks.push(f);
                }
            }
            catch { }
        }
    }
    console.log('Secret in Git tracked files:  ', gitLeaks.length === 0 ? 'CLEAN (0)' : gitLeaks);
}
catch (err) {
    console.log('Git check warning:', err.message);
}
