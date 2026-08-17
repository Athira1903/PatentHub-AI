"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatentSearchService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PatentSearchService {
    /**
     * Performs patent search. Dynamically switches between USPTO API and Local Mock Registry.
     */
    static async search(query) {
        if (!query || !query.trim()) {
            return [];
        }
        const apiKey = process.env.PATENTSVIEW_API_KEY;
        const isMockMode = !apiKey || apiKey === 'your_patentsview_api_key_here' || apiKey.trim() === '';
        if (isMockMode) {
            return this.searchMockRegistry(query);
        }
        return this.searchLiveUSPTO(query, apiKey);
    }
    /**
     * Search local mock registry.
     */
    static searchMockRegistry(query) {
        try {
            let mockFilePath = path_1.default.join(__dirname, '../data/mockPatents.json');
            if (!fs_1.default.existsSync(mockFilePath)) {
                mockFilePath = path_1.default.join(__dirname, '../config/mockPatents.json');
            }
            if (!fs_1.default.existsSync(mockFilePath)) {
                return [];
            }
            const fileData = fs_1.default.readFileSync(mockFilePath, 'utf-8');
            const mockPatents = JSON.parse(fileData);
            const queryLower = query.toLowerCase().trim();
            const filtered = mockPatents.filter((p) => {
                const titleMatch = p.title && p.title.toLowerCase().includes(queryLower);
                const abstractMatch = p.abstract && p.abstract.toLowerCase().includes(queryLower);
                const numberMatch = p.patentNumber && p.patentNumber.toLowerCase().includes(queryLower);
                const inventorMatch = p.inventors && p.inventors.toLowerCase().includes(queryLower);
                const assigneeMatch = p.assignee && p.assignee.toLowerCase().includes(queryLower);
                return titleMatch || abstractMatch || numberMatch || inventorMatch || assigneeMatch;
            });
            return filtered.map((p) => ({
                patentNumber: p.patentNumber,
                title: p.title.startsWith('[OFFLINE]') ? p.title : `[OFFLINE] ${p.title}`,
                abstract: p.abstract || null,
                claims: p.claims || null,
                url: p.url || null,
                inventors: p.inventors || null,
                assignee: p.assignee || null,
                publishDate: p.publishDate || null,
                source: 'MOCK'
            }));
        }
        catch (error) {
            console.error('Mock patent search failure:', error);
            return [];
        }
    }
    /**
     * Search live USPTO PatentsView API.
     */
    static async searchLiveUSPTO(query, apiKey) {
        const url = process.env.PATENTSVIEW_API_URL || 'https://api.patentsview.org/patents/query';
        // Construct query parameter for PatentsView (searches title, abstract, or patent number)
        const patentsViewQuery = {
            "_or": [
                { "_text_any": { "patent_title": query } },
                { "_text_any": { "patent_abstract": query } },
                { "_text_any": { "patent_number": query } }
            ]
        };
        const fields = [
            "patent_number",
            "patent_title",
            "patent_abstract",
            "patent_date",
            "patent_firstnamed_inventor_name",
            "patent_firstnamed_assignee_name"
        ];
        const targetUrl = `${url}?q=${encodeURIComponent(JSON.stringify(patentsViewQuery))}&f=${encodeURIComponent(JSON.stringify(fields))}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout
        try {
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': apiKey
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.status === 401 || response.status === 403) {
                console.warn('USPTO API Authentication failed. Falling back to mock dataset.');
                return this.searchMockRegistry(query);
            }
            if (response.status === 429) {
                console.warn('USPTO API rate limit exceeded. Falling back to mock dataset.');
                return this.searchMockRegistry(query);
            }
            if (!response.ok) {
                console.warn(`USPTO API error (Status ${response.status}). Falling back to mock dataset.`);
                return this.searchMockRegistry(query);
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.patents)) {
                return [];
            }
            return data.patents.map((p) => ({
                patentNumber: p.patent_number,
                title: p.patent_title || 'Untitled Patent',
                abstract: p.patent_abstract || null,
                claims: null,
                url: `https://patents.google.com/patent/US${p.patent_number}`,
                inventors: p.patent_firstnamed_inventor_name || null,
                assignee: p.patent_firstnamed_assignee_name || null,
                publishDate: p.patent_date || null,
                source: 'USPTO'
            }));
        }
        catch (error) {
            clearTimeout(timeoutId);
            console.warn('Live USPTO search error, falling back to mock registry:', error.message || error);
            return this.searchMockRegistry(query);
        }
    }
}
exports.PatentSearchService = PatentSearchService;
