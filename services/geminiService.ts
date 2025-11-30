
import { GoogleGenAI } from "@google/genai";
import { Report, VerdictType, Source, SourceCategory, KeyEvidence } from "../types";

// VITE/VERCEL DEPLOYMENT CONFIGURATION
let apiKey = '';

try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY;
    }
} catch (e) {
    // Ignore reference errors in non-Vite environments
}

// Fallback for local testing
if (!apiKey) {
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env?.API_KEY) {
            // @ts-ignore
            apiKey = process.env.API_KEY;
        }
    } catch (e) {}
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_INSTRUCTION = `
You are SOPHON, a Military-Grade Intelligence Sentinel.
Your output must be FACTUALLY IMPECCABLE. Zero tolerance for hallucination.

CORE DIRECTIVE: "TRIANGULATION"
- A claim is VERIFIED only if supported by at least TWO independent Tier-1 sources (Reuters, AP, Gov).
- If sources disagree, the verdict is UNCERTAIN.
- If the only sources are Social Media, the verdict is UNCERTAIN.

STRICT TIME PROTOCOL (TIMESTAMP LABELING):
- EXTRACT DATES for every event.
- CLASSIFY "timeContext" based on event age relative to NOW:
  1. "Breaking": Event happened < 24 hours ago.
  2. "Recent": Event happened 1 day to 1 month ago.
  3. "Old": Event happened 1 month to 3 years ago.
  4. "Very Old": Event happened > 3 years ago.

BAD ACTOR DETECTION:
- Flag any source from known satire sites (Onion, Babylon Bee) as FALSE/SATIRE.
- Flag state-sponsored propaganda as BIASED.

OUTPUT FORMAT:
Strict JSON. No markdown.
`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGeminiWithRetry(modelName: string, params: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent({
                model: modelName,
                ...params
            });
        } catch (error: any) {
            if (error.status === 503 || error.code === 503 || error.status === 429) {
                await sleep(2000 * (i + 1)); 
                continue;
            }
            throw error; 
        }
    }
    throw new Error("Gemini API Unresponsive");
}

const checkBadActor = (url: string): { isSuspicious: boolean, scorePenalty: number } => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.xyz') || lowerUrl.includes('.top')) return { isSuspicious: true, scorePenalty: 80 };
    if (lowerUrl.includes('wordpress') || lowerUrl.includes('blogspot')) return { isSuspicious: true, scorePenalty: 50 };
    // Trusted
    if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('reuters') || lowerUrl.includes('bbc')) return { isSuspicious: false, scorePenalty: 0 };
    return { isSuspicious: false, scorePenalty: 20 }; // Default penalty for unknown
};

export const scanForTopics = async (focus?: string): Promise<{ query: string, sector: string }[]> => {
  try {
    // ADVANCED FEDERATED SCANNING STRATEGY
    const prompt = `
        Act as a Real-Time Information Aggregator.
        Perform a live scan of the following sectors using Google Search:
        
        1. GLOBAL_NEWS_WIRE: Find 2 major breaking news headlines from trusted outlets (Reuters, AP, BBC) from the last 2 hours.
        2. REDDIT_HIVE: Find 1 viral discussion thread from r/news, r/worldnews, or r/technology that is trending right now.
        3. ANON_RUMORS: Find 1 "happening" or "rumor" topic currently circulating on 4chan /pol/ or /news/ (Clean/SFW summaries only).
        
        CRITICAL: 
        - DO NOT generate fake or hypothetical examples.
        - You MUST use the Google Search Tool to find REAL current links.
        - If no rumors are found, default to another News Headline.
        
        Output format: JSON Array of objects: 
        [
            { "query": "Headline 1...", "sector": "GLOBAL_NEWS" },
            { "query": "Headline 2...", "sector": "GLOBAL_NEWS" },
            { "query": "Reddit Thread Topic...", "sector": "REDDIT_HIVE" },
            { "query": "4chan Rumor Topic...", "sector": "ANON_RUMORS" }
        ]
    `;
    
    const response = await callGeminiWithRetry('gemini-2.5-flash', {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const text = response.text?.replace(/```json|```/g, '').trim() || "[]";
    try {
        const results = JSON.parse(text);
        if (Array.isArray(results) && results.length > 0) return results;
        return [{ query: "Global News Scan", sector: "GLOBAL_NEWS" }];
    } catch (e) {
        return [{ query: "Global News Scan", sector: "GLOBAL_NEWS" }];
    }
  } catch (error) {
    return [{ query: "Breaking Global News", sector: "GLOBAL_NEWS" }];
  }
};

export const fetchGlobalNews = async (): Promise<{headline: string, summary: string, source: string, time: string, url: string}[]> => {
    try {
        const prompt = `
        List 5 top global news headlines from the last 12 hours.
        For each, provide a VERY SHORT summary (max 15 words).
        Format as a JSON Array of objects: [{"headline": "...", "summary": "...", "source": "...", "time": "...", "url": "..."}].
        Use reliable sources.
        `;
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        // Helper to extract JSON from text which might contain markdown blocks
        const text = response.text || "";
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const investigateTopic = async (query: string, originSector: string = "MANUAL_INPUT", useDeepScan: boolean = false): Promise<Report | null> => {
  try {
    // 1. TRIANGULATION SEARCH (Multiple Angles)
    const queries = [query];
    
    // Sector specific query adjustment
    if (originSector === 'REDDIT_HIVE') {
        queries.push(`site:reddit.com "${query}" discussion`);
        queries.push(`"${query}" fact check`);
    } else if (originSector === 'ANON_RUMORS') {
        queries.push(`"${query}" debunked`);
        queries.push(`"${query}" official source`);
    } else if (useDeepScan) {
        queries.push(`"${query}" official verification fact check`);
    }

    let combinedContext = "";
    let allSources: Source[] = [];

    for (const q of queries) {
        const res = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Investigate: ${q}`,
            config: { tools: [{ googleSearch: {} }] }
        });
        combinedContext += `\nSOURCE DATA (${q}):\n${res.text}\n`;
        
        // Extract Grounding Metadata (Real Links)
        if (res.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            res.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    const check = checkBadActor(chunk.web.uri);
                    allSources.push({
                        title: chunk.web.title || "Source",
                        url: chunk.web.uri,
                        category: check.isSuspicious ? SourceCategory.UNKNOWN : SourceCategory.NEWS,
                        reliabilityScore: Math.max(0, 100 - check.scorePenalty),
                        date: undefined // Will try to extract from text later
                    });
                }
            });
        }
    }

    // 2. SYNTHESIS (The Judge)
    const finalPrompt = `
    Analyze this Triangulated Data.
    
    DATA:
    ${combinedContext}
    
    TASK:
    Generate a Forensic Report.
    
    RULES:
    - If sources contradict, verdict is UNCERTAIN.
    - If timeContext is "Very Old" (>3 years), verdict is OUTDATED.
    - If timeContext is "Old" (1 month - 3 years), verdict is NOT_RECENT.
    - If trusted sources (Reliability > 80) confirm, verdict is VERIFIED.
    - If origin is ANON_RUMORS/REDDIT and no official source confirms, verdict must be UNCERTAIN or MISLEADING.
    - Extract SPECIFIC dates for the event.
    
    RETURN JSON (Report Interface Structure).
    `;

    const analysis = await callGeminiWithRetry('gemini-2.5-flash', {
        contents: finalPrompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    const jsonStr = analysis.text?.replace(/```json|```/g, '').trim() || "{}";
    const data = JSON.parse(jsonStr);

    // 3. CLEANUP & MERGE
    // Deduplicate sources by URL
    const uniqueSources = Array.from(new Map(allSources.map(s => [s.url, s])).values());
    
    // Sort sources: Gov/Reuters first, Suspicious last
    uniqueSources.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: data.topic || query,
        claim: data.claim || "Analysis of search query",
        verdict: data.verdict || VerdictType.UNCERTAIN,
        summary: data.summary || "Insufficient data for summary.",
        confidenceScore: data.confidenceScore || 50,
        sourceReliability: uniqueSources.length > 0 ? uniqueSources[0].reliabilityScore : 0,
        sources: uniqueSources.slice(0, 6), // Top 6 sources
        tags: data.tags || [],
        originSector,
        detectedLanguage: data.detectedLanguage || "English",
        keyEvidence: data.keyEvidence || [],
        relatedThemes: data.relatedThemes || [],
        entities: data.entities || [],
        evolutionTrace: data.evolutionTrace || [],
        socialPulse: data.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'N/A', hotSpots: [] },
        timeContext: data.timeContext, // Will be Breaking, Recent, Old, or Very Old
        communityVotes: { up: 0, down: 0 }
    };

  } catch (error) {
    console.error("Deep Investigation Failed", error);
    return null;
  }
};

// NEW: Semantic Search for Blockchain Ledger
export const searchLedgerSemantically = async (query: string, headlines: {id: string, text: string}[]): Promise<string[]> => {
    try {
        if (!headlines.length || !query.trim()) return [];
        
        // Cap at 50 for performance in this demo
        const batch = headlines.slice(0, 50);
        
        const prompt = `
        You are an intelligent search system for a blockchain ledger.
        User Query: "${query}"
        
        Analyze these Headlines (ID: Text):
        ${batch.map(h => `${h.id}: ${h.text}`).join('\n')}
        
        Return a JSON ARRAY of IDs (hash strings) for headlines that are semantically relevant to the query.
        Example: ["0x123...", "0xabc..."]
        `;
        
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const raw = response.text?.replace(/```json|```/g, '').trim() || "[]";
        const result = JSON.parse(raw);
        return Array.isArray(result) ? result.map(String) : [];
    } catch (e) {
        console.error("Semantic Search Failed", e);
        return [];
    }
};

export const verifyCommunityNote = async (note: string, context: string): Promise<boolean> => {
    return false; // Disabled features
};

export const analyzeManualQuery = async (q: string, deep: boolean) => investigateTopic(q, "USER_INPUT", deep);
export const analyzeImageClaim = async (b64: string, mime: string) => {
    return investigateTopic("Image Analysis", "FORENSIC", true); 
};
export const analyzeAudioClaim = async (b64: string, mime: string) => {
    return investigateTopic("Audio Analysis", "FORENSIC", true);
};
export const chatWithAgent = async (hist: any[], msg: string, rep: Report) => {
    try {
        const contextPrompt = `
        You are SOPHON, a Senior Intelligence Analyst.
        
        CONTEXT:
        Topic: "${rep.topic}".
        Verdict: ${rep.verdict}.
        Full Facts: ${rep.summary}.
        
        USER QUESTION: "${msg}"
        
        INSTRUCTIONS:
        1. Answer directly and authoritatively. Use "Situation Room" lingo.
        2. If the user asks for sources, refer to the report.
        3. Suggest 3 tactical follow-up questions.
        
        OUTPUT JSON:
        { "answer": "...", "suggestedQuestions": ["..."] }
        `;

        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: hist.concat([{ role: 'user', parts: [{ text: contextPrompt }] }]),
            config: { responseMimeType: "application/json" }
        });
        
        return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || "{}");
    } catch (e) {
        return { answer: "Secure connection disrupted.", suggestedQuestions: [] };
    }
};
export const neutralizeBias = async (txt: string) => txt; 
export const findSemanticMatch = async (q: string, list: string[]) => null;
export const analyzeBotSwarm = async (input: string) => ({ probability: 0, analysis: "", tactics: [] });
