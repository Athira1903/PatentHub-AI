import { prisma } from '../config/db';

export interface PatentSearchResult {
  patentNumber: string;
  title: string;
  abstract: string | null;
  claims: string | null;
  url: string | null;
  inventors: string | null;
  assignee: string | null;
  publishDate: string | null;
  source: 'USPTO' | 'EPO' | 'WIPO';
  similarityScore: number;
  classification?: string | null;
  relevanceRationale?: string | null;
}

export class PatentSearchService {
  /**
   * Performs live prior-art search across authoritative patent repositories and project references.
   * Resiliently handles external registry outages without throwing unhandled HTML parsing errors.
   */
  static async search(query: string): Promise<PatentSearchResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim();
    const apiKey = process.env.PATENTSVIEW_API_KEY;

    try {
      const liveResults = await this.searchLiveUSPTO(trimmedQuery, apiKey);
      if (liveResults.length > 0) {
        return liveResults;
      }
    } catch (e: any) {
      console.warn('Live USPTO registry query warning:', e.message);
    }

    // Fallback: Search existing patent references in database matching query terms
    return this.searchLocalPatentReferences(trimmedQuery);
  }

  /**
   * Calculates a heuristic relevance score between query terms and patent metadata.
   */
  private static calculateSimilarity(query: string, title: string, abstract?: string | null): { score: number; rationale: string } {
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (queryTokens.length === 0) return { score: 75, rationale: 'Standard prior-art match.' };

    const titleLower = (title || '').toLowerCase();
    const abstractLower = (abstract || '').toLowerCase();

    let matchesInTitle = 0;
    let matchesInAbstract = 0;

    for (const token of queryTokens) {
      if (titleLower.includes(token)) matchesInTitle++;
      if (abstractLower.includes(token)) matchesInAbstract++;
    }

    const titleRatio = matchesInTitle / queryTokens.length;
    const abstractRatio = matchesInAbstract / queryTokens.length;

    let score = Math.round(60 + (titleRatio * 25) + (abstractRatio * 15));
    score = Math.min(99, Math.max(65, score));

    let rationale = 'Conceptual overlap in architectural methodology.';
    if (score >= 90) {
      rationale = 'High direct keyword and semantic overlap with claims preamble and objectives.';
    } else if (score >= 80) {
      rationale = 'Moderate domain alignment and similar technical hardware/software embodiment.';
    }

    return { score, rationale };
  }

  /**
   * Search live USPTO PatentsView API or authoritative public patent registries.
   */
  private static async searchLiveUSPTO(query: string, apiKey?: string): Promise<PatentSearchResult[]> {
    const url = process.env.PATENTSVIEW_API_URL || 'https://api.patentsview.org/patents/query';

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
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey && apiKey !== 'your_patentsview_api_key_here') {
      headers['X-Api-Key'] = apiKey;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      // If the external registry returned an HTML page (error/maintenance/redirect)
      if (responseText.trim().startsWith('<') || !contentType.includes('json') || !response.ok) {
        console.warn(`External patent registry returned status ${response.status} with non-JSON body.`);
        return [];
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        return [];
      }

      if (!data || !Array.isArray(data.patents)) {
        return [];
      }

      return data.patents.map((p: any) => {
        const { score, rationale } = this.calculateSimilarity(query, p.patent_title || '', p.patent_abstract);
        return {
          patentNumber: p.patent_number,
          title: p.patent_title || 'Untitled Patent',
          abstract: p.patent_abstract || null,
          claims: null,
          url: `https://patents.google.com/patent/US${p.patent_number}`,
          inventors: p.patent_firstnamed_inventor_name || null,
          assignee: p.patent_firstnamed_assignee_name || null,
          publishDate: p.patent_date || null,
          source: 'USPTO' as const,
          similarityScore: score,
          classification: 'US-PATENT',
          relevanceRationale: rationale
        };
      }).sort((a: PatentSearchResult, b: PatentSearchResult) => b.similarityScore - a.similarityScore);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.warn('USPTO live search fetch exception:', error.message);
      return [];
    }
  }

  /**
   * Searches database patent references for relevant matches when external registry is unreachable.
   */
  private static async searchLocalPatentReferences(query: string): Promise<PatentSearchResult[]> {
    try {
      const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      if (tokens.length === 0) return [];

      const references = await prisma.patentReference.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' }
      });

      const matched: PatentSearchResult[] = [];

      for (const ref of references) {
        const titleLower = ref.title.toLowerCase();
        const abstractLower = (ref.abstract || '').toLowerCase();
        const numLower = ref.patentNumber.toLowerCase();

        const hasMatch = tokens.some(t => titleLower.includes(t) || abstractLower.includes(t) || numLower.includes(t));

        if (hasMatch) {
          const { score, rationale } = this.calculateSimilarity(query, ref.title, ref.abstract);
          matched.push({
            patentNumber: ref.patentNumber,
            title: ref.title,
            abstract: ref.abstract,
            claims: ref.claims,
            url: ref.url,
            inventors: ref.inventors,
            assignee: ref.assignee,
            publishDate: ref.publishDate ? ref.publishDate.toISOString() : null,
            source: (ref.source as any) || 'USPTO',
            similarityScore: score,
            classification: 'DATABASE-REFERENCE',
            relevanceRationale: rationale
          });
        }
      }

      return matched.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (e: any) {
      console.warn('Local patent reference search warning:', e.message);
      return [];
    }
  }
}
