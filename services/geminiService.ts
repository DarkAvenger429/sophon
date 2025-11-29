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
} catch (e) {}

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

export const DATA_SECTORS = [
  "GLOBAL_NEWS", "VIRAL_MISINFORMATION", "CRYPTO_SCAMS", "AI_DEEPFAKES", "CYBER_ATTACKS"
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGeminiWithRetry(modelName: string, params: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent({
                model: modelName,
                ...params
            });
        } catch (error: any) {
            // Check for 503 Overloaded or 429 Rate Limit
            if (error.status === 503 || error.code === 503 || error.status === 429 || error.message?.includes('429')) {
                // If it's the last retry, throw specific error
                if (i === retries - 1) throw new Error("TOO_MANY_REQUESTS");
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
    if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('reuters') || lowerUrl.includes('bbc')) return { isSuspicious: false, scorePenalty: 0 };
    return { isSuspicious: false, scorePenalty: 20 };
};

export const scanForTopics = async (sector: string = "GLOBAL_NEWS"): Promise<{ query: string, sector: string }[]> => {
  try {
    const prompt = `Find 3 trending ${sector.replace(/_/g, ' ')} headlines from the last 6 hours. JSON Array of strings.`;
    const response = await callGeminiWithRetry('gemini-2.5-flash', {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    const text = response.text?.replace(/```json|```/g, '').trim() || "[]";
    const queries = JSON.parse(text);
    return queries.map((q: string) => ({ query: q, sector }));
  } catch (error) {
    return [{ query: "Breaking News", sector }];
  }
};

export const investigateTopic = async (query: string, originSector: string = "MANUAL_INPUT", useDeepScan: boolean = false): Promise<Report | null> => {
  try {
    // 1. TRIANGULATION SEARCH
    const queries = [query];
    if (useDeepScan) {
        queries.push(`"${query}" official verification fact check`);
        queries.push(`"${query}" debunked`);
    }

    let combinedContext = "";
    let allSources: Source[] = [];

    for (const q of queries) {
        const res = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Investigate: ${q}`,
            config: { tools: [{ googleSearch: {} }] }
        });
        combinedContext += `\nSOURCE DATA (${q}):\n${res.text}\n`;
        
        if (res.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            res.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    const check = checkBadActor(chunk.web.uri);
                    allSources.push({
                        title: chunk.web.title || "Source",
                        url: chunk.web.uri,
                        category: check.isSuspicious ? SourceCategory.UNKNOWN : SourceCategory.NEWS,
                        reliabilityScore: Math.max(0, 100 - check.scorePenalty),
                        date: undefined
                    });
                }
            });
        }
    }

    // 2. SYNTHESIS
    const finalPrompt = `
    Analyze this Triangulated Data.
    DATA: ${combinedContext}
    TASK: Generate a Forensic Report.
    RETURN JSON (Report Interface Structure).
    `;

    const analysis = await callGeminiWithRetry('gemini-2.5-flash', {
        contents: finalPrompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    const jsonStr = analysis.text?.replace(/```json|```/g, '').trim() || "{}";
    const data = JSON.parse(jsonStr);

    const uniqueSources = Array.from(new Map(allSources.map(s => [s.url, s])).values());
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
        sources: uniqueSources.slice(0, 6),
        tags: data.tags || [],
        originSector,
        detectedLanguage: data.detectedLanguage || "English",
        keyEvidence: data.keyEvidence || [],
        relatedThemes: data.relatedThemes || [],
        entities: data.entities || [],
        evolutionTrace: data.evolutionTrace || [],
        socialPulse: data.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'N/A', hotSpots: [] },
        timeContext: data.timeContext,
        communityVotes: { up: 0, down: 0 }
    };

  } catch (error: any) {
    console.error("Deep Investigation Failed", error);
    
    // --- GRACEFUL FALLBACK FOR RATE LIMITS ---
    if (error.message === "TOO_MANY_REQUESTS" || error.message?.includes("429")) {
        return {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            topic: "System Overload",
            claim: query,
            verdict: VerdictType.UNCERTAIN,
            summary: "⚠️ TOO MANY API CALLS. The system is currently overloaded due to high demand. Please wait 60 seconds before scanning again.",
            confidenceScore: 0,
            sourceReliability: 0,
            sources: [],
            tags: ["SYSTEM_ERROR"],
            originSector: "ERROR",
            detectedLanguage: "English",
            keyEvidence: [],
            relatedThemes: [],
            entities: [],
            socialPulse: { sentiment: 'NEUTRAL', score: 0, topNarrative: 'System Offline', hotSpots: [] }
        };
    }
    return null;
  }
};

export const verifyCommunityNote = async (note: string, context: string): Promise<boolean> => {
    try {
        const res = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Verify this user note against known facts. Context: "${context}". Note: "${note}". Return JSON: { "isVerified": boolean }`
        });
        const json = JSON.parse(res.text?.replace(/```json|```/g, '').trim() || "{}");
        return json.isVerified === true;
    } catch { return false; }
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
        CONTEXT: Topic: "${rep.topic}". Verdict: ${rep.verdict}.
        USER QUESTION: "${msg}"
        OUTPUT JSON: { "answer": "...", "suggestedQuestions": ["..."] }
        `;
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: hist.concat([{ role: 'user', parts: [{ text: contextPrompt }] }]),
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || "{}");
    } catch (e) {
        return { answer: "Secure connection disrupted. Please retry.", suggestedQuestions: [] };
    }
};
export const neutralizeBias = async (txt: string) => txt; 
export const findSemanticMatch = async (q: string, list: string[]) => null;
export const analyzeBotSwarm = async (input: string) => ({ probability: 0, analysis: "", tactics: [] });
