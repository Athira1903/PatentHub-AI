"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function checkFile(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        console.log('File does not exist:', filePath);
        return;
    }
    console.log('Checking file:', filePath);
    const text = fs_1.default.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');
    lines.forEach((l, i) => {
        if (l.includes('RAZORPAY')) {
            const parts = l.split('=');
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            console.log(`Line ${i + 1}: Key=[${key}], ValLength=${val.length}, StartsQuote=${val.startsWith('"') || val.startsWith("'")}, EndsQuote=${val.endsWith('"') || val.endsWith("'")}, Prefix=${val.slice(0, 8)}...`);
        }
    });
}
checkFile('d:/patent/server/.env');
checkFile('d:/patent/.env');
