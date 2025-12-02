

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Report, VerdictType, Source, SourceCategory, KeyEvidence } from "../types";

// --- API KEY LANES ---
// Separation of concerns to prevent quota contention
const KEY_NEWS_WIRE = 'AIzaSyDyG3xm2R8hCGILPQRUSE8qvB5TxToC8ao';
const KEY_MANUAL = 'AIzaSyA8FUSe6Bd7ivMCp5-tiVzBwxarLsgclD4';
const KEY_SCANNER = 'AIzaSyATaHMWhes05hsETC3b9wtz5nYAvQYqFP8';

// POOL FOR BACKUP / OVERFLOW
const BACKUP_POOL = [
    'AIzaSyDWUPDyt99gXDksDfOAyFy4-kCwITUJuO0',
    'AIzaSyDK2bK1HEvcNdkjrESsJlkinI9sgzqLKPQ'
];

// VITE/VERCEL ENVIRONMENT OVERRIDE
try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        const envKey = import.meta.env.VITE_API_KEY;
        if (envKey) {
            BACKUP_POOL.unshift(envKey);
        }
    }
} catch (e) {}

const SYSTEM_INSTRUCTION = `
You are SOPHON, a Global Situational Awareness Engine.

CORE DIRECTIVE: "OBSERVE AND VERIFY"
1. You are a neutral observer. Your goal is to map the information landscape accurately.
2. DO NOT assume everything is misinformation. Most news is true. Identify it as such.
3. If a topic is breaking news, the status is "DEVELOPING", not "UNCERTAIN".

VERDICT PROTOCOL:
- VERIFIED: Corroborated by Reuters, AP, BBC, or Government sources.
- DEVELOPING: Breaking event with incomplete data, but reliable initial reports.
- MISLEADING: True facts used to support a false narrative (Context collapse).
- FALSE: Explicitly debunked claims or fabrications.
- UNCERTAIN: Conflicting reports from equal-weight sources.

OUTPUT FORMAT:
Strict JSON. No markdown.
`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const checkBadActor = (url: string): { isSuspicious: boolean, scorePenalty: number } => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.xyz') || lowerUrl.includes('.top')) return { isSuspicious: true, scorePenalty: 80 };
    if (lowerUrl.includes('wordpress') || lowerUrl.includes('blogspot')) return { isSuspicious: true, scorePenalty: 50 };
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('facebook')) return { isSuspicious: false, scorePenalty: 30 };
    
    // Trusted
    if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('reuters') || lowerUrl.includes('bbc') || lowerUrl.includes('apnews') || lowerUrl.includes('bloomberg')) return { isSuspicious: false, scorePenalty: 0 };
    
    return { isSuspicious: false, scorePenalty: 10 }; // Default penalty for unknown
};

// --- CACHE HELPERS ---
const CACHE_KEYS = {
    NEWS: 'sophon_cache_news',
    TOPICS: 'sophon_cache_topics'
};

const saveToCache = (key: string, data: any) => {
    try {
        if (!data || (Array.isArray(data) && data.length === 0)) return;
        const payload = { timestamp: Date.now(), data };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
        console.warn("Cache Save Failed", e);
    }
};

const getFromCache = (key: string, maxAgeHours: number = 24) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        const age = (Date.now() - payload.timestamp) / (1000 * 60 * 60);
        if (age > maxAgeHours) return null; // Expired
        return payload.data;
    } catch (e) {
        return null;
    }
};

type Lane = 'NEWS' | 'MANUAL' | 'SCANNER';

// --- INTELLIGENT DISPATCHER ---
async function dispatchGeminiCall(modelName: string, params: any, lane: Lane) {
    let primaryKey;
    switch (lane) {
        case 'NEWS': primaryKey = KEY_NEWS_WIRE; break;
        case 'MANUAL': primaryKey = KEY_MANUAL; break;
        case 'SCANNER': primaryKey = KEY_SCANNER; break;
    }

    // 1. Try Primary Lane Key
    try {
        const ai = new GoogleGenAI({ apiKey: primaryKey });
        return await ai.models.generateContent({ model: modelName, ...params });
    } catch (error: any) {
        console.warn(`Lane ${lane} Primary Key Failed (${error.status || error.message}). Switching to Backup Pool.`);
        
        // 2. Backup Pool Rotation
        let lastError;
        for (const backupKey of BACKUP_POOL) {
            try {
                const ai = new GoogleGenAI({ apiKey: backupKey });
                return await ai.models.generateContent({ model: modelName, ...params });
            } catch (e: any) {
                lastError = e;
                if (e.status === 429) {
                    await sleep(1000); // Backoff for backup keys
                    continue; 
                }
            }
        }
        throw lastError || new Error(`All keys exhausted for lane ${lane}`);
    }
}

export const scanForTopics = async (focus?: string): Promise<{ query: string, sector: string }[]> => {
  try {
    const prompt = `
        Act as a News Aggregator.
        List 3 REAL, CURRENT global news headlines (Geopolitics, Tech, Finance) from the last 24 hours.
        Use Google Search to verify they are real.
        
        Output STRICT JSON Array: 
        [{"query": "Headline 1", "sector": "SECTOR_GEO"}, {"query": "Headline 2", "sector": "SECTOR_TECH"}, {"query": "Headline 3", "sector": "SECTOR_FIN"}]
    `;
    
    const response = await dispatchGeminiCall('gemini-2.5-flash', {
      contents: prompt,
      config: { 
          tools: [{ googleSearch: {} }]
      }
    }, 'SCANNER');
    
    const text = response.text?.replace(/```json|```/g, '').trim() || "[]";
    let results = [];
    try {
        results = JSON.parse(text);
    } catch (e) {
        const match = text.match(/\[.*\]/s);
        if (match) results = JSON.parse(match[0]);
    }

    if (Array.isArray(results) && results.length > 0) {
        saveToCache(CACHE_KEYS.TOPICS, results); 
        return results;
    }
    throw new Error("Empty scan results");

  } catch (error: any) {
    console.warn("Scan Failed, attempting cache fallback:", error.message);
    const cached = getFromCache(CACHE_KEYS.TOPICS);
    if (cached) return cached;
    return []; 
  }
};

export const fetchGlobalNews = async (): Promise<{headline: string, summary: string, source: string, time: string, url: string}[]> => {
    try {
        const prompt = `
        Find 6 TOP verified global news headlines from the last 12 hours.
        Focus on Major Geopolitics, Finance, and Tech.
        Return strictly JSON.
        Format: [{"headline": "...", "summary": "...", "source": "...", "time": "..."}]
        `;
        
        const response = await dispatchGeminiCall('gemini-2.5-flash', {
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
        }, 'NEWS');
        
        const text = response.text?.replace(/```json|```/g, '').trim() || "[]";
        let results = [];
        try {
            results = JSON.parse(text);
        } catch (e) {
            const match = text.match(/\[.*\]/s);
            if (match) results = JSON.parse(match[0]);
        }

        if (Array.isArray(results) && results.length > 0) {
            const safeResults = results.map((r: any) => ({
                ...r,
                url: `https://news.google.com/search?q=${encodeURIComponent(r.headline + " " + r.source)}`
            }));

            saveToCache(CACHE_KEYS.NEWS, safeResults);
            return safeResults;
        }
        throw new Error("Empty news response");

    } catch (e: any) {
        console.warn("Fetch Global News Failed:", e.message);
        const cached = getFromCache(CACHE_KEYS.NEWS);
        if (cached) return cached;
        return [];
    }
};

export const investigateTopic = async (query: string, originSector: string = "MANUAL_INPUT", useDeepScan: boolean = false): Promise<Report | null> => {
  try {
    const lane: Lane = (originSector === 'USER_INPUT' || originSector === 'FORENSIC') ? 'MANUAL' : 'SCANNER';
    
    const vectorPrompt = `
    Conduct a forensic investigation on: "${query}"
    
    Using Google Search, find:
    1. Verified facts and news coverage.
    2. Verification status (fact checks).
    3. Public sentiment/reaction.
    4. Origin/Source of the claim.
    
    Then, OUTPUT ONLY A JSON OBJECT matching this structure:
    {
      "topic": "Concise Headline",
      "claim": "The core event/claim",
      "verdict": "VERIFIED" | "DEVELOPING" | "FALSE" | "MISLEADING" | "UNCERTAIN",
      "summary": "Forensic summary (approx 150 words).",
      "confidenceScore": 90,
      "timeContext": "Recent",
      "detectedLanguage": "English",
      "socialPulse": { "sentiment": "NEUTRAL", "score": 50, "topNarrative": "...", "hotSpots": ["Twitter"] },
      "patientZero": { "platform": "...", "username": "...", "timestamp": "...", "contentFragment": "...", "estimatedReach": "..." },
      "relatedThemes": ["Tag1", "Tag2"],
      "entities": ["Entity1"],
      "keyEvidence": [{ "point": "...", "type": "SUPPORTING" }]
    }
    `;

    const currentDate = new Date().toISOString().split('T')[0];

    const response = await dispatchGeminiCall('gemini-2.5-flash', {
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
    }, lane);

    const text = response.text?.replace(/```json|```/g, '').trim() || "{}";
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            data = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } else {
            data = {};
        }
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
        summary: data.summary || "Intelligence acquisition failed. No structured data returned.",
        confidenceScore: data.confidenceScore || 50,
        sourceReliability: topSources.length > 0 ? topSources[0].reliabilityScore : 50,
        sources: topSources,
        tags: data.relatedThemes || [],
        originSector,
        detectedLanguage: data.detectedLanguage || "English",
        keyEvidence: data.keyEvidence || [],
        relatedThemes: data.relatedThemes || [],
        entities: data.entities || [],
        evolutionTrace: [],
        socialPulse: data.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'Insufficient Data', hotSpots: [] },
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
        
        const prompt = `
        User Query: "${query}"
        Analyze these Headlines (ID: Text):
        ${batch.map(h => `${h.id}: ${h.text}`).join('\n')}
        
        Return JSON ARRAY of IDs relevant to the query.
        `;
        
        const response = await dispatchGeminiCall('gemini-2.5-flash', {
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }, 'MANUAL');
        
        const raw = response.text || "[]";
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
};

export const verifyCommunityNote = async (note: string, context: string): Promise<boolean> => {
    try {
        const response = await dispatchGeminiCall('gemini-2.5-flash', {
            contents: `Context: ${context}. Note: ${note}. Is this note factually accurate? Return JSON { "valid": boolean }`,
            config: { responseMimeType: "application/json" }
        }, 'MANUAL');
        const data = JSON.parse(response.text || "{}");
        return !!data.valid;
    } catch {
        return false;
    }
};

export const analyzeManualQuery = async (q: string, deep: boolean) => investigateTopic(q, "USER_INPUT", deep);
export const analyzeImageClaim = async (b64: string, mime: string) => investigateTopic("Visual Analysis", "FORENSIC", true); 
export const analyzeAudioClaim = async (b64: string, mime: string) => investigateTopic("Audio Analysis", "FORENSIC", true);

export const chatWithAgent = async (hist: any[], msg: string, rep: Report) => {
    try {
        const response = await dispatchGeminiCall('gemini-2.5-flash', {
            contents: hist.concat([{ role: 'user', parts: [{ text: `Context: ${rep.summary}. Question: ${msg}` }] }]),
            config: { responseMimeType: "application/json" }
        }, 'MANUAL');
        return JSON.parse(response.text || "{}");
    } catch {
        return { answer: "Secure connection disrupted.", suggestedQuestions: [] };
    }
};

export const neutralizeBias = async (txt: string) => txt; 
export const findSemanticMatch = async (q: string, list: string[]) => null;
export const analyzeBotSwarm = async (input: string) => ({ probability: 0, analysis: "", tactics: [] });
