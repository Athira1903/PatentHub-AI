"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
async function testGeneration() {
    const apiKey = process.env.GEMINI_API_KEY;
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const result = await model.generateContent('Hello, provide a 1-sentence test response about patent engineering.');
        console.log('SUCCESSFUL TEST RESPONSE:\n', result.response.text());
    }
    catch (err) {
        console.error('Generation Error:', err);
    }
}
testGeneration();
