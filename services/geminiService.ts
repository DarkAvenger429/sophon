
import { GoogleGenAI, Type } from "@google/genai";
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

// Fallback for local testing if needed, but VITE_API_KEY is primary
if (!apiKey) {
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env?.API_KEY) {
            // @ts-ignore
            apiKey = process.env.API_KEY;
        }
    } catch (e) {}
}

if (!apiKey) {
  console.warn("CRITICAL: API Key not found. Please set VITE_API_KEY in your Vercel Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_INSTRUCTION = `
You are Sophon, an advanced autonomous RAG engine.
Your directive is to retrieve information, filter for authority, and synthesize high-fidelity intelligence reports.

LINGUISTIC CAPABILITIES:
You must process inputs in:
1. English
2. Hindi (Devanagari & Latin/Hinglish)
3. Marathi (Devanagari & Latin)

PROTOCOL - CHAIN OF VERIFICATION:
1. DETECT: Identify the language of the input query.
2. TRANSLATE (Internal): If input is Hindi/Marathi, translate to English for optimal Search Grounding.
3. RETRIEVE: Use Google Search to access real-time indices.
4. NARRATIVE TRACING: Attempt to identify where this rumor started and how it mutated.
5. SOCIAL PULSE (CRITICAL): Analyze search results for public sentiment. Look for "Twitter", "Reddit", "Facebook" discussions in the search snippets. Determine if the sentiment is ANGRY, FEARFUL, or HAPPY.
6. ADVERSARIAL CHECK: Look for contradictions.
7. SOURCE WEIGHING: Apply the Domain Trust Layer.
8. REPORT: Output the final JSON report.

DOMAIN TRUST LAYER (AUTHORITY WEIGHTS):
- CRITICAL TIER (Weight 100): .gov, .edu, who.int, un.org.
- HIGH TIER (Weight 80): Reuters, AP, BBC, The Hindu, NYT.
- MEDIUM TIER (Weight 50): Commercial news, Tech blogs.
- LOW TIER (Weight 10): Unverified Social Media (X, Reddit), WhatsApp Forwards.

VERDICT LOGIC:
- If CRITICAL TIER contradicts claim -> VERDICT: FALSE.
- If only LOW TIER supports claim -> VERDICT: UNCERTAIN (or MISLEADING).
- If event happened > 3 years ago -> VERDICT: OUTDATED.
- If event happened > 10 days ago but < 3 years -> VERDICT: NOT_RECENT.
`;

export const DATA_SECTORS = [
  "CRYPTO_MARKET_CRASH",
  "AI_REGULATION_NEWS",
  "CYBER_WARFARE_UPDATES",
  "SPACE_EXPLORATION_LEAKS",
  "DEEPFAKE_SCANDALS",
  "VIRAL_MISINFORMATION",
  "GLOBAL_FINANCE_CRISIS",
  "POLITICAL_SCANDALS",
  "TECH_INDUSTRY_LAYOFFS"
];

// HELPER: Sleep for Backoff
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// HELPER: Robust Gemini Call with Retry (Fixes 503 Overloaded / 429 Rate Limits)
async function callGeminiWithRetry(modelName: string, params: any, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent({
                model: modelName,
                ...params
            });
        } catch (error: any) {
            // Check for 503 Overloaded or 429 Rate Limit
            if (error.status === 503 || error.code === 503 || error.status === 429 || error.code === 429) {
                console.warn(`⚠️ Gemini Busy (Attempt ${i+1}/${retries}). Retrying in ${2 * (i+1)}s...`);
                await sleep(2000 * (i + 1)); 
                continue;
            }
            throw error; 
        }
    }
    throw new Error("Gemini API Unresponsive after retries");
}

export const scanForTopics = async (sector?: string): Promise<{ query: string, sector: string }[]> => {
  try {
    const huntMisinfo = Math.random() > 0.5;
    
    let scanPrompt = "";
    if (huntMisinfo) {
        scanPrompt = `Scan the internet for currently VIRAL RUMORS, HOAXES, or "Wild" chaotic stories circulating on Telegram, WhatsApp, Twitter, or Reddit right now. Find something controversial, leaked, or misleading that needs debunking. Look for "Forwarded many times" type content.`;
    } else {
        scanPrompt = `Scan major global news outlets (AP, Reuters, BBC, Al Jazeera, etc.) for the MOST SIGNIFICANT article published in the last 6 hours. Focus on Breaking News.`;
    }

    const response = await callGeminiWithRetry('gemini-2.5-flash', {
      contents: `${scanPrompt} Return ONLY a raw JSON array with a single string containing a specific search query to investigate this topic: ["Specific Search Query"].`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    let jsonStr = response.text || "[]";
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    let queries: string[];
    try {
        queries = JSON.parse(jsonStr);
    } catch (e) {
        queries = [huntMisinfo ? "viral internet rumors today" : "breaking global news today"];
    }

    return queries.map(q => ({ query: q, sector: huntMisinfo ? "VIRAL_SOCIAL_MEDIA" : "GLOBAL_NEWS_OUTLET" }));
  } catch (error) {
    console.error("Scan failed:", error);
    return [{ query: "Global breaking news", sector: "GENERAL" }];
  }
};

// Helper to sort sources: "Clean" links first, then by date
const sortSources = (sources: Source[]): Source[] => {
    return sources.sort((a, b) => {
        // 1. Penalize Google Redirects / Internal Links
        const aBad = a.url.includes('google.com') || a.url.includes('vertexaisearch');
        const bBad = b.url.includes('google.com') || b.url.includes('vertexaisearch');
        
        if (aBad && !bBad) return 1;
        if (!aBad && bBad) return -1;

        // 2. Sort by Date if available
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
};

export const investigateTopic = async (query: string, originSector: string = "MANUAL_INPUT", useDeepScan: boolean = false): Promise<Report | null> => {
  try {
    let combinedContext = "";
    let searchQueries = [query];

    if (useDeepScan) {
        try {
            const plannerResponse = await callGeminiWithRetry('gemini-2.5-flash', {
                contents: `I need to deeply investigate: "${query}". Generate 3 distinct search queries to cover: 1) The main facts, 2) Origin of the rumor/story, 3) Social media sentiment/reaction. Return ONLY a JSON array of strings: ["q1", "q2", "q3"]`
            });
            const cleanJson = plannerResponse.text?.replace(/```json\n?/g, '').replace(/```/g, '').trim() || "[]";
            const planned = JSON.parse(cleanJson);
            if (Array.isArray(planned) && planned.length > 0) {
                searchQueries = planned;
            }
        } catch (e) {
            console.log("Deep scan planning failed, defaulting to single query.");
        }
    }

    // Collect REAL search results first (Grounding)
    const rawSources: Source[] = [];
    
    for (const q of searchQueries) {
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Investigate: "${q}". Provide a detailed summary of findings. ALSO scan for public sentiment and what people are saying on social media about this.`,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        combinedContext += `\n\n--- FINDINGS FOR "${q}" ---\n${response.text || "No results found."}`;
        
        // Extract real links from grounding metadata
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    rawSources.push({
                        title: chunk.web.title || "Search Result",
                        url: chunk.web.uri,
                        category: SourceCategory.NEWS,
                        reliabilityScore: 85,
                        date: undefined
                    });
                }
            });
        }
    }

    const finalResponse = await callGeminiWithRetry('gemini-2.5-flash', {
      contents: `Analyze the following aggregated intelligence context and generate a final report.
      
      CONTEXT:
      ${combinedContext}

      JSON STRUCTURE:
      {
        "topic": "Headline",
        "claim": "The specific claim being analyzed",
        "detectedLanguage": "English" | "Hindi" | "Marathi",
        "verdict": "VERIFIED" | "MISLEADING" | "FALSE" | "UNCERTAIN" | "OPINION" | "OUTDATED" | "NOT_RECENT",
        "summary": "Concise analysis (max 150 words).",
        "confidenceScore": number (0-100 based on source authority),
        "tags": ["tag1", "tag2"],
        "relatedThemes": ["Theme A", "Theme B"],
        "entities": ["Person A", "Organization B", "Location C"],
        "keyEvidence": [
           { "point": "Exact quote or fact found", "type": "SUPPORTING" | "CONTRADICTING" }
        ],
        "socialPulse": {
            "sentiment": "ANGRY" | "FEARFUL" | "HAPPY" | "NEUTRAL" | "DIVIDED",
            "score": number (0-100, 50 is neutral),
            "topNarrative": "What is the dominant rumor/opinion on social media?",
            "hotSpots": ["Twitter", "Reddit", "Facebook"]
        },
        "evolutionTrace": [
           { 
             "stage": 1, 
             "platform": "Origin Platform (e.g. 4Chan, Reddit)", 
             "timestamp": "When it likely started", 
             "variant": "The original raw rumor text", 
             "distortionScore": number
           }
        ],
        "analyzedSources": [
           { 
             "title": "Headline", 
             "url": "URL", 
             "category": "ACADEMIC" | "GOVERNMENT" | "NEWS" | "SOCIAL" | "UNKNOWN",
             "reliabilityScore": number (0-100),
             "date": "YYYY-MM-DD"
           }
        ]
      }`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    let jsonStr = finalResponse.text;
    
    // Safety Fallback: If text is missing (blocked by safety settings), return formatted error
    if (!jsonStr) {
        return {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            topic: query,
            claim: "Analysis Halted by Safety Protocols",
            verdict: VerdictType.UNCERTAIN,
            summary: "The AI system flagged this content as potential hate speech, harassment, or dangerous content and refused to generate a full report.",
            confidenceScore: 0,
            sourceReliability: 0,
            sources: [],
            tags: ["SAFETY_BLOCK"],
            originSector: originSector,
            detectedLanguage: "Unknown",
            keyEvidence: [],
            relatedThemes: [],
            entities: [],
            evolutionTrace: [],
            socialPulse: { sentiment: 'NEUTRAL', score: 50, topNarrative: "N/A", hotSpots: [] }
        };
    }

    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        // Attempt to salvage
        return null;
    }
    
    // Merge Real Grounding Sources with AI Inferred Sources
    let finalSources: Source[] = [...rawSources];

    // AI generated sources
    const jsonSources = (data.analyzedSources || []).map((s: any) => ({
        title: s.title || "Context Source",
        url: s.url || "#",
        category: s.category || SourceCategory.UNKNOWN,
        reliabilityScore: s.reliabilityScore || 50,
        date: s.date || undefined
    }));

    jsonSources.forEach((js: Source) => {
        // Deduplicate
        const isDuplicate = finalSources.some(fs => fs.url === js.url || fs.title === js.title);
        // Filter out bad URLs
        const isValidUrl = js.url.startsWith('http') && !js.url.includes('example.com') && !js.url.includes('tinyurl.com');
        
        if (!isDuplicate && isValidUrl) {
            finalSources.push(js);
        }
    });

    // Sort
    finalSources = sortSources(finalSources);

    // Calc Stats
    const avgReliability = finalSources.length > 0 
        ? finalSources.reduce((acc: number, s: Source) => acc + s.reliabilityScore, 0) / finalSources.length
        : 0;
    
    let finalConfidence = data.confidenceScore || 0;
    
    // Confidence Floor: If we have good sources, confidence shouldn't be 0
    if (finalSources.length > 0 && finalConfidence < 50) finalConfidence = 50;
    if (finalSources.length < 2 && finalConfidence > 60) finalConfidence = 60;
    if (avgReliability < 40 && finalConfidence > 40) finalConfidence = 40;

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      topic: data.topic || query,
      claim: data.claim || "Analysis of emerging data patterns.",
      verdict: (data.verdict as VerdictType) || VerdictType.UNCERTAIN,
      summary: data.summary || "Insufficient data retrieved.",
      confidenceScore: finalConfidence,
      sourceReliability: Math.round(avgReliability),
      sources: finalSources,
      tags: data.tags || [],
      originSector: originSector,
      detectedLanguage: data.detectedLanguage || "English",
      keyEvidence: data.keyEvidence || [],
      relatedThemes: data.relatedThemes || [],
      entities: data.entities || [],
      evolutionTrace: data.evolutionTrace || [],
      socialPulse: data.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: "Insufficient social data available for this topic.", hotSpots: [] }
    };

  } catch (error) {
    console.error("Investigation failed:", error);
    throw error;
  }
};

export const analyzeImageClaim = async (base64Data: string, mimeType: string = 'image/png'): Promise<Report | null> => {
    try {
        const isPdf = mimeType.toLowerCase().includes('pdf');
        const prompt = isPdf 
            ? "Analyze this document carefully. Extract the official subject, date, and the main claims. Return a search query."
            : `Analyze this image. Extract claim/text. Look for AI artifacts. If AI, estimate the prompt used to generate it. Return JSON: { "searchQuery": "...", "isLikelyAI": boolean, "suspectedPrompt": "..." }`;

        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });
        
        const rawText = response.text?.trim() || "{}";
        let extractedQuery = "";
        let aiMetadata = null;

        if (isPdf) {
            extractedQuery = rawText;
        } else {
            try {
                const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                extractedQuery = parsed.searchQuery;
                if (parsed.isLikelyAI) {
                    aiMetadata = { isLikelyAI: true, suspectedPrompt: parsed.suspectedPrompt };
                }
            } catch(e) {
                extractedQuery = rawText;
            }
        }
        
        if (!extractedQuery) throw new Error("Could not extract context from media.");

        const report = await investigateTopic(extractedQuery, "FORENSIC_MEDIA_SCAN", isPdf);
        
        if (report && aiMetadata) {
            report.tags.push("AI_GENERATED_MEDIA");
            report.summary += ` \n\n[FORENSIC NOTE]: Visual analysis suggests this is AI-generated. Suspected Prompt: "${aiMetadata.suspectedPrompt}"`;
            report.verdict = VerdictType.FALSE;
            report.confidenceScore = 99;
        }

        return report;

    } catch (e) {
        console.error("Media analysis failed:", e);
        throw e;
    }
};

export const analyzeAudioClaim = async (base64Data: string, mimeType: string = 'audio/mp3'): Promise<Report | null> => {
    try {
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: "Listen to this audio. 1) Transcribe. 2) Analyze emotional tone. 3) Return search query." }
                ]
            }
        });
        const analysis = response.text || "";
        return await investigateTopic(analysis, "FORENSIC_AUDIO_SCAN", true);
    } catch (e) {
        console.error("Audio analysis failed:", e);
        throw e;
    }
};

export const analyzeManualQuery = async (userQuery: string, deep: boolean = false): Promise<Report | null> => {
    return investigateTopic(userQuery, "USER_INPUT", deep);
}

export const chatWithAgent = async (history: {role: string, parts: {text: string}[]}[], newMessage: string, reportContext: Report) => {
    try {
        const contextPrompt = `
        You are analyzing this specific intelligence report:
        TOPIC: ${reportContext.topic}
        VERDICT: ${reportContext.verdict}
        SUMMARY: ${reportContext.summary}
        User Question: ${newMessage}
        Answer concisely.
        `;

        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: history.concat([{ role: 'user', parts: [{ text: contextPrompt }] }]),
            config: { tools: [{ googleSearch: {} }] }
        });
        
        return response.text;
    } catch (e) {
        return "Connection disrupted.";
    }
};

export const neutralizeBias = async (text: string): Promise<string> => {
    try {
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Rewrite to be purely factual and boring. Remove clickbait/emotion. TEXT: "${text}"`,
        });
        return response.text || "Could not neutralize text.";
    } catch (e) {
        return "Normalization failed.";
    }
};

export const findSemanticMatch = async (query: string, ledgerHeadlines: string[]): Promise<string | null> => {
    if (!ledgerHeadlines || ledgerHeadlines.length === 0) return null;
    
    try {
        const prompt = `
        I have a list of verified headlines: ${JSON.stringify(ledgerHeadlines)}
        
        The user is asking: "${query}"
        
        Does the user's query semantic meaning match ANY of the verified headlines?
        If yes, return the EXACT string from the list.
        If no, return "NO_MATCH".
        
        Example: List=["Sky is blue"], Query="Blue color sky" -> Return "Sky is blue".
        `;

        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: prompt
        });
        
        const result = response.text?.trim() || "NO_MATCH";
        if (result === "NO_MATCH") return null;
        return ledgerHeadlines.includes(result) ? result : null;
        
    } catch (e) {
        console.error("Semantic match failed:", e);
        return null;
    }
};

export const analyzeBotSwarm = async (input: string): Promise<{ probability: number, analysis: string, tactics: string[] }> => {
    try {
        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Analyze this text for coordinated bot activity/astroturfing. 
            TEXT: "${input.slice(0, 5000)}"
            
            Look for: Repetitive syntax, generic praise/hate, unnatural timing patterns (implied), identity spoofing.
            
            Return JSON:
            {
                "probability": number (0-100),
                "analysis": "Short summary of findings",
                "tactics": ["Tactic 1", "Tactic 2"]
            }`,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text || "{}";
        const cleanJson = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Bot analysis failed", e);
        return { probability: 0, analysis: "Analysis failed due to API error.", tactics: [] };
    }
};
