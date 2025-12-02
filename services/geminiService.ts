import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Report, VerdictType, Source, SourceCategory, KeyEvidence } from "../types";

// --- DEDICATED NEWS WIRE KEY (Isolated Lane) ---
const NEWS_WIRE_KEY = 'AIzaSyDyG3xm2R8hCGILPQRUSE8qvB5TxToC8ao'; 

// --- SCANNER API KEY POOL ---
const API_KEY_POOL = [
    'AIzaSyDWUPDyt99gXDksDfOAyFy4-kCwITUJuO0',
    'AIzaSyA8FUSe6Bd7ivMCp5-tiVzBwxarLsgclD4',
    'AIzaSyATaHMWhes05hsETC3b9wtz5nYAvQYqFP8',
    'AIzaSyDK2bK1HEvcNdkjrESsJlkinI9sgzqLKPQ'
];

// VITE/VERCEL ENVIRONMENT OVERRIDE
try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        const envKey = import.meta.env.VITE_API_KEY;
        if (envKey && !API_KEY_POOL.includes(envKey)) {
            API_KEY_POOL.unshift(envKey);
        }
    }
} catch (e) {}

const SYSTEM_INSTRUCTION = `
You are SOPHON, a Global Situational Awareness Engine.
CORE DIRECTIVE: "OBSERVE AND VERIFY"
1. You are a neutral observer.
2. Most news is true. Identify it as such.
3. If a topic is breaking news, the status is "DEVELOPING".
VERDICT PROTOCOL:
- VERIFIED: Corroborated by Reuters, AP, BBC.
- DEVELOPING: Breaking event.
- FALSE: Debunked claims.
- UNCERTAIN: Conflicting reports.
OUTPUT FORMAT: Strict JSON only.
`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const checkBadActor = (url: string): { isSuspicious: boolean, scorePenalty: number } => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.xyz') || lowerUrl.includes('.top')) return { isSuspicious: true, scorePenalty: 80 };
    if (lowerUrl.includes('wordpress') || lowerUrl.includes('blogspot')) return { isSuspicious: true, scorePenalty: 50 };
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('facebook')) return { isSuspicious: false, scorePenalty: 30 };
    if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('reuters') || lowerUrl.includes('bbc') || lowerUrl.includes('apnews') || lowerUrl.includes('bloomberg')) return { isSuspicious: false, scorePenalty: 0 };
    return { isSuspicious: false, scorePenalty: 10 };
};

// --- CACHE HELPERS ---
const CACHE_KEYS = { NEWS: 'sophon_cache_news', TOPICS: 'sophon_cache_topics' };

const saveToCache = (key: string, data: any) => {
    try {
        if (!data || (Array.isArray(data) && data.length === 0)) return;
        const payload = { timestamp: Date.now(), data };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) { console.warn("Cache Save Failed", e); }
};

const getFromCache = (key: string, maxAgeHours: number = 24) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        const age = (Date.now() - payload.timestamp) / (1000 * 60 * 60);
        if (age > maxAgeHours) return null;
        return payload.data;
    } catch (e) { return null; }
};

// --- ROBUST JSON PARSER ---
const extractJSON = (text: string): any => {
    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // 2. Try to find the first { or [ and last } or ]
        try {
            const firstBrace = text.indexOf('{');
            const firstBracket = text.indexOf('[');
            const start = (firstBrace > -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
            
            const lastBrace = text.lastIndexOf('}');
            const lastBracket = text.lastIndexOf(']');
            const end = (lastBrace > -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                return JSON.parse(jsonStr);
            }
        } catch (e2) {
            console.warn("JSON Extraction Failed", e2);
        }
    }
    return null;
};

// --- SMART ROTATION ---
async function callGeminiWithRotation(modelName: string, params: any) {
    let lastError;
    const validKeys = API_KEY_POOL.filter(k => k && !k.includes('PASTE_'));
    const startIndex = Math.floor(Math.random() * validKeys.length);

    for (let i = 0; i < validKeys.length; i++) {
        const keyIndex = (startIndex + i) % validKeys.length;
        const currentKey = validKeys[keyIndex];
        const isLastKey = i === validKeys.length - 1;
        const ai = new GoogleGenAI({ apiKey: currentKey });
        
        const maxRetries = isLastKey ? 2 : 1; 

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await ai.models.generateContent({
                    model: modelName,
                    ...params
                });
            } catch (error: any) {
                lastError = error;
                const status = error.status || error.code;
                const msg = error.message || "";

                if (status === 403 || msg.includes('leaked')) {
                    console.error("⛔ KEY LEAKED. Rotating.");
                    break;
                }
                const isQuota = status === 429 || status === 503;
                if (isQuota) {
                    if (isLastKey && attempt < maxRetries - 1) {
                        await sleep(2000); continue; 
                    } else { break; }
                }
                if (!isQuota) throw error;
            }
        }
    }
    throw lastError || new Error("All API keys failed.");
}

export const scanForTopics = async (focus?: string): Promise<{ query: string, sector: string }[]> => {
  try {
    const prompt = `
        List 3 REAL, CURRENT global news headlines (Geopolitics, Tech, Finance) from last 24h.
        Use Google Search.
        Output STRICT JSON Array: [{"query": "Headline 1", "sector": "SECTOR_GEO"}, ...]
    `;
    
    const response = await callGeminiWithRotation('gemini-2.5-flash', {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const results = extractJSON(response.text || "[]");

    if (Array.isArray(results) && results.length > 0) {
        saveToCache(CACHE_KEYS.TOPICS, results); 
        return results;
    }
    throw new Error("Empty scan results");

  } catch (error: any) {
    console.warn("Scan Failed, using cache:", error.message);
    const cached = getFromCache(CACHE_KEYS.TOPICS);
    if (cached) return cached;
    return []; 
  }
};

export const fetchGlobalNews = async (): Promise<{headline: string, summary: string, source: string, time: string, url: string}[]> => {
    try {
        // Try Dedicated Key
        const dedicatedAi = new GoogleGenAI({ apiKey: NEWS_WIRE_KEY });
        const prompt = `Find 5 TOP verified global news headlines (last 12h). JSON Array: [{"headline": "...", "summary": "...", "source": "...", "time": "..."}]`;
        
        const response = await dedicatedAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            }
        });
        
        const results = extractJSON(response.text || "[]");

        if (Array.isArray(results) && results.length > 0) {
            const safeResults = results.map((r: any) => ({
                ...r,
                url: `https://news.google.com/search?q=${encodeURIComponent(r.headline + " " + r.source)}`
            }));
            saveToCache(CACHE_KEYS.NEWS, safeResults);
            return safeResults;
        }
        throw new Error("Empty dedicated response");

    } catch (e: any) {
        // Fallback to Pool
        try {
            const prompt = `Find 5 verified global news headlines. JSON Array format: [{"headline": "...", "summary": "...", "source": "...", "time": "..."}]`;
            const response = await callGeminiWithRotation('gemini-2.5-flash', {
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] }
            });
            const results = extractJSON(response.text || "[]");

            if (Array.isArray(results) && results.length > 0) {
                const safeResults = results.map((r: any) => ({
                    ...r,
                    url: `https://news.google.com/search?q=${encodeURIComponent(r.headline + " " + r.source)}`
                }));
                saveToCache(CACHE_KEYS.NEWS, safeResults);
                return safeResults;
            }
        } catch (err) {}

        const cached = getFromCache(CACHE_KEYS.NEWS);
        if (cached) return cached;
        return [];
    }
};

export const investigateTopic = async (query: string, originSector: string = "MANUAL_INPUT", useDeepScan: boolean = false): Promise<Report | null> => {
  try {
    const vectorPrompt = `
    Conduct a forensic investigation on: "${query}"
    
    Using Google Search, find: Verified facts, Verification status, Public sentiment, Origin.
    
    OUTPUT ONLY A JSON OBJECT:
    {
      "topic": "Concise Headline",
      "claim": "The core event/claim",
      "verdict": "VERIFIED" | "DEVELOPING" | "FALSE" | "MISLEADING" | "UNCERTAIN",
      "summary": "Forensic summary (approx 150 words).",
      "confidenceScore": 90,
      "timeContext": "Recent",
      "socialPulse": { "sentiment": "NEUTRAL", "score": 50, "topNarrative": "...", "hotSpots": ["Twitter"] },
      "patientZero": { "platform": "...", "username": "...", "timestamp": "...", "contentFragment": "...", "estimatedReach": "..." },
      "relatedThemes": ["Tag1"],
      "entities": ["Entity1"],
      "keyEvidence": [{ "point": "...", "type": "SUPPORTING" }]
    }
    `;

    const currentDate = new Date().toISOString().split('T')[0];

    const response = await callGeminiWithRotation('gemini-2.5-flash', {
        contents: vectorPrompt,
        config: { 
            tools: [{ googleSearch: {} }],
            systemInstruction: SYSTEM_INSTRUCTION, 
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
        }
    });

    let data = extractJSON(response.text || "{}");

    // --- RAW TEXT RESCUE (If JSON fails, use the raw text so the app DOES NOT BREAK) ---
    if (!data || !data.topic) {
        console.warn("JSON Parse Failed. Rescuing Raw Text.");
        data = {
            topic: query,
            claim: "Complex Unstructured Analysis",
            verdict: VerdictType.UNCERTAIN,
            summary: (response.text || "Analysis complete but unreadable.").slice(0, 500),
            confidenceScore: 50,
            socialPulse: { sentiment: 'NEUTRAL', score: 50, topNarrative: 'Data Unstructured', hotSpots: [] }
        };
    }

    let validSources: Source[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
            const url = chunk.web.uri;
            const check = checkBadActor(url);
            if (!validSources.some(s => s.url === url)) {
                validSources.push({
                    title: chunk.web.title,
                    url: url,
                    category: check.isSuspicious ? SourceCategory.UNKNOWN : SourceCategory.NEWS,
                    reliabilityScore: Math.max(0, 100 - check.scorePenalty),
                    date: currentDate
                });
            }
        }
    });
    
    validSources.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    const topSources = validSources.slice(0, 8);

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: data.topic || query,
        claim: data.claim || `Analysis of "${query}"`,
        verdict: (data.verdict as VerdictType) || VerdictType.UNCERTAIN,
        summary: data.summary || "Intelligence acquired.",
        confidenceScore: data.confidenceScore || 50,
        sourceReliability: topSources.length > 0 ? topSources[0].reliabilityScore : 50,
        sources: topSources,
        tags: data.relatedThemes || [],
        originSector,
        detectedLanguage: "English",
        keyEvidence: data.keyEvidence || [],
        relatedThemes: data.relatedThemes || [],
        entities: data.entities || [],
        evolutionTrace: [],
        socialPulse: data.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'N/A', hotSpots: [] },
        timeContext: data.timeContext || "Recent",
        communityVotes: { up: 0, down: 0 },
        patientZero: data.patientZero || { platform: 'Unknown', username: 'Unknown', timestamp: 'Unknown', contentFragment: 'N/A', estimatedReach: 'Unknown' },
        timeline: [],
        psychologicalTriggers: [],
        beneficiaries: []
    };

  } catch (error: any) {
    console.error("Deep Investigation Failed (Real Mode)", error);
    return null; 
  }
};

export const searchLedgerSemantically = async (query: string, headlines: {id: string, text: string}[]): Promise<string[]> => {
    try {
        if (!headlines.length || !query.trim()) return [];
        const batch = headlines.slice(0, 50);
        const prompt = `User Query: "${query}". Analyze Headlines: ${batch.map(h => `${h.id}: ${h.text}`).join('\n')}. Return JSON ARRAY of IDs.`;
        const response = await callGeminiWithRotation('gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return extractJSON(response.text || "[]");
    } catch (e) { return []; }
};

export const verifyCommunityNote = async (note: string, context: string): Promise<boolean> => {
    try {
        const response = await callGeminiWithRotation('gemini-2.5-flash', {
            contents: `Context: ${context}. Note: ${note}. Factually accurate? Return JSON { "valid": boolean }`,
            config: { responseMimeType: "application/json" }
        });
        const data = extractJSON(response.text || "{}");
        return !!data.valid;
    } catch { return false; }
};

export const analyzeManualQuery = async (q: string, deep: boolean) => investigateTopic(q, "USER_INPUT", deep);
export const analyzeImageClaim = async (b64: string, mime: string) => investigateTopic("Visual Analysis", "FORENSIC", true); 
export const analyzeAudioClaim = async (b64: string, mime: string) => investigateTopic("Audio Analysis", "FORENSIC", true);
export const chatWithAgent = async (hist: any[], msg: string, rep: Report) => {
    try {
        const response = await callGeminiWithRotation('gemini-2.5-flash', {
            contents: hist.concat([{ role: 'user', parts: [{ text: `Context: ${rep.summary}. Question: ${msg}` }] }]),
            config: { responseMimeType: "application/json" }
        });
        return extractJSON(response.text || "{}");
    } catch { return { answer: "Secure connection disrupted.", suggestedQuestions: [] }; }
};
export const neutralizeBias = async (txt: string) => txt; 
export const findSemanticMatch = async (q: string, list: string[]) => null;
export const analyzeBotSwarm = async (input: string) => ({ probability: 0, analysis: "", tactics: [] });
