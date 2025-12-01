
import { GoogleGenAI } from "@google/genai";
import { Report, VerdictType, Source, SourceCategory, KeyEvidence } from "../types";

// VITE/VERCEL DEPLOYMENT CONFIGURATION
let apiKey = 'AIzaSyDK2bK1HEvcNdkjrESsJlkinI9sgzqLKPQ';

try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY || apiKey;
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
            apiKey = process.env.API_KEY || apiKey;
        }
    } catch (e) {}
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_INSTRUCTION = `
You are SOPHON, a Military-Grade Intelligence Sentinel.

CORE DIRECTIVE: "ACCURACY ABOVE ALL"
1. You are connected to Google Search. You MUST use real-time data.
2. If the user asks about a current event, DO NOT rely on internal training data. Use the provided Grounding Data.
3. If search results are empty, admit "INSUFFICIENT DATA". Do not hallucinate.

VERDICT PROTOCOL:
- VERIFIED: Corroborated by Reuters, AP, BBC, or Government sources.
- FALSE: Debunked by fact-checkers (Snopes, PolitiFact) or official denials.
- MISLEADING: True facts used to support a false narrative (Missing context).
- UNCERTAIN: Conflicting reports or only social media sources.

OUTPUT FORMAT:
Strict JSON. No markdown. No pre-amble.
`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGeminiWithRetry(modelName: string, params: any, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent({
                model: modelName,
                ...params
            });
        } catch (error: any) {
            // Fail fast on Quota errors to switch to simulation immediately
            if (error.message?.includes('quota') || error.message?.includes('Quota') || error.status === 429) {
                 console.warn(`⚠️ API Quota Limit Detected.`);
                 throw new Error("QUOTA_EXCEEDED");
            }
            
            if (error.status === 503 || error.code === 503) {
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
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerUrl.includes('facebook')) return { isSuspicious: false, scorePenalty: 30 };
    
    // Trusted
    if (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('reuters') || lowerUrl.includes('bbc') || lowerUrl.includes('apnews') || lowerUrl.includes('snopes')) return { isSuspicious: false, scorePenalty: 0 };
    
    return { isSuspicious: false, scorePenalty: 10 }; // Default penalty for unknown
};

// --- SIMULATION FALLBACKS ---
const generateSimulationReport = (query: string): Report => {
    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: query,
        claim: "Analysis generated in Simulation Mode due to API constraints.",
        verdict: VerdictType.UNCERTAIN,
        summary: `[SIMULATION MODE ACTIVE] The Sophon Sentinel Intelligence Engine is currently operating in failsafe mode due to high network traffic or API quota limits. 

        Under normal operation, a query on "${query}" would trigger a multi-vector search across Tier-1 news outlets, social media sentiment analysis, and cross-verification against known fact-checking databases. This simulation demonstrates the report structure including the Origin Matrix (Patient Zero), Temporal Timeline, and Psy-Op Analysis fields.
        
        Real-time forensic scanning will resume automatically when the connection stabilizes.`,
        confidenceScore: 0,
        sourceReliability: 100,
        sources: [
            { title: "System Alert: Quota / Network Limit", url: "#", category: SourceCategory.UNKNOWN, reliabilityScore: 0, date: new Date().toISOString().split('T')[0] }
        ],
        tags: ["Simulation", "Failsafe_Active", "System_Alert"],
        originSector: "SIMULATION_CORE",
        detectedLanguage: "English",
        keyEvidence: [
            { point: "API Limit or Network Timeout Detected", type: 'CONTRADICTING' },
            { point: "System switched to Fail-Safe Mode to preserve UI integrity.", type: 'SUPPORTING' }
        ],
        relatedThemes: ["System Ops", "API Management"],
        entities: ["Sophon Sentinel", "Google Gemini"],
        socialPulse: { 
            sentiment: 'ANGRY', 
            score: 85, 
            topNarrative: "Users are reporting intermittent connectivity with the primary intelligence node.", 
            hotSpots: ["Developer Forums", "System Logs"] 
        },
        timeContext: "Recent",
        communityVotes: { up: 0, down: 0 },
        patientZero: {
            platform: "System Core",
            username: "@Admin_Console",
            timestamp: new Date().toISOString(),
            contentFragment: "Error: Service Unavailable. Simulation Engaged.",
            estimatedReach: "Internal Only"
        },
        timeline: [
            { date: new Date().toISOString().split('T')[0], description: "Scan initiated by user.", source: "User Terminal" },
            { date: new Date().toISOString().split('T')[0], description: "External Link Failed.", source: "Gemini Relay" },
            { date: new Date().toISOString().split('T')[0], description: "Fail-safe Simulation Activated.", source: "Sophon Core" }
        ],
        psychologicalTriggers: ["Frustration", "Impatience"],
        beneficiaries: ["API Providers"]
    };
};

const generateSimulatedNews = () => [
    {
        headline: "Global Markets Rally Amid Tech Surge",
        summary: "Major indices hit record highs as AI sector continues to outperform expectations. Investors are optimistic about future growth.",
        source: "Reuters (Simulated)",
        time: "10m ago",
        url: "#"
    },
    {
        headline: "New Climate Accord Signed in Paris",
        summary: "190 nations agree to aggressive carbon reduction targets for 2030, aiming to limit global warming to 1.5 degrees Celsius.",
        source: "AP (Simulated)",
        time: "1h ago",
        url: "#"
    },
    {
        headline: "Breakthrough in Fusion Energy Announced",
        summary: "Scientists achieve net energy gain in latest reactor tests, marking a significant milestone towards limitless clean energy.",
        source: "Science Daily (Simulated)",
        time: "2h ago",
        url: "#"
    },
    {
        headline: "Cyberattack Targets Financial Infrastructure",
        summary: "Coordinated DDOS attacks reported across multiple banking sectors. Cybersecurity teams are investigating the origin.",
        source: "CyberWire (Simulated)",
        time: "Breaking",
        url: "#"
    },
    {
        headline: "SpaceX Launches Next Gen Satellites",
        summary: "Successful deployment of Starlink V2 constellation confirmed. Coverage expected to improve in remote regions.",
        source: "SpaceNews (Simulated)",
        time: "4h ago",
        url: "#"
    }
];

export const scanForTopics = async (focus?: string): Promise<{ query: string, sector: string }[]> => {
  try {
    const prompt = `
        Act as a Real-Time Information Aggregator.
        Perform a live scan of the following sectors using Google Search:
        
        1. GLOBAL_NEWS_WIRE: Find 2 major breaking news headlines from trusted outlets (Reuters, AP, BBC) from the last 2 hours.
        2. REDDIT_HIVE: Find 1 viral discussion thread from r/news, r/worldnews, or r/technology that is trending right now.
        3. ANON_RUMORS: Find 1 "happening" or "rumor" topic currently circulating on social media (Clean/SFW summaries only).
        
        Output format: JSON Array of objects: 
        [
            { "query": "Headline 1...", "sector": "GLOBAL_NEWS" },
            { "query": "Headline 2...", "sector": "GLOBAL_NEWS" },
            { "query": "Reddit Thread Topic...", "sector": "REDDIT_HIVE" },
            { "query": "Rumor Topic...", "sector": "ANON_RUMORS" }
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
        // Fallback if array is empty
        return [
            { query: "Simulated: Market Volatility", sector: "GLOBAL_NEWS" },
            { query: "Simulated: Tech Leak Rumors", sector: "REDDIT_HIVE" }
        ];
    } catch (e) {
        throw new Error("Parse Error");
    }
  } catch (error: any) {
    console.warn("Scan failed, using simulation.");
    return [
        { query: "Simulated: Market Crash Rumors", sector: "ANON_RUMORS" },
        { query: "Simulated: Tech Policy Update", sector: "GLOBAL_NEWS" },
        { query: "Simulated: Viral Video Debunk", sector: "REDDIT_HIVE" }
    ];
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
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "[]";
        let news = [];
        try {
            news = JSON.parse(text);
        } catch(e) {
             const jsonMatch = text.match(/\[.*\]/s);
             news = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        }

        if (!Array.isArray(news) || news.length === 0) {
            throw new Error("Empty News Response");
        }
        return news;

    } catch (e: any) {
        console.warn("News sync failed, activating simulation wire.");
        return generateSimulatedNews() as any;
    }
};

export const investigateTopic = async (query: string, originSector: string = "MANUAL_INPUT", useDeepScan: boolean = false): Promise<Report | null> => {
  try {
    // PHASE 1: INTELLIGENCE GATHERING (Triangulation)
    
    const searchVectors = [
        `"${query}" details verified sources`,                // Vector 1: Facts
        `"${query}" public reaction twitter reddit sentiment`, // Vector 2: Social Pulse
        `"${query}" origin first source date`                 // Vector 3: Provenance
    ];

    if (originSector === 'REDDIT_HIVE') searchVectors.push(`site:reddit.com "${query}" discussion`);
    if (originSector === 'ANON_RUMORS') searchVectors.push(`"${query}" debunked hoax`);

    let fullEvidenceBuffer = "";
    let validSources: Source[] = [];

    // Execute vectors sequentially with delay to be polite to API
    for (const vector of searchVectors) {
        await sleep(1000); // 1s delay to prevent rate limit spikes

        const searchRes = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: `Find precise information for: ${vector}`,
            config: { tools: [{ googleSearch: {} }] }
        });

        // Harvest Sources
        const chunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
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
                    });
                }
            }
        });

        if (searchRes.text) {
             fullEvidenceBuffer += `\n[SEARCH VECTOR: ${vector}]\n${searchRes.text}\n`;
        }
    }
    
    validSources.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    const topSources = validSources.slice(0, 8);

    if (fullEvidenceBuffer.length < 50) {
        console.warn("Insufficient evidence gathered.");
        // If evidence is totally empty, we might want to fallback if it's a connection issue, 
        // but for now we let the model try to say "UNCERTAIN" unless it threw an error.
    }

    const currentDate = new Date().toISOString().split('T')[0];

    // PHASE 2: FORENSIC ANALYSIS (The Judge)
    const finalPrompt = `
    Analyze this Triangulated Data.
    
    CONTEXTUAL DATA:
    CURRENT DATE: ${currentDate}

    EVIDENCE STREAM:
    ${fullEvidenceBuffer}
    
    SOURCE RELIABILITY MAP:
    ${JSON.stringify(topSources.map(s => `${s.title}: ${s.reliabilityScore}%`))}
    
    TASK:
    Generate a Forensic Intelligence Report.
    
    CRITICAL RULES:
    1.  **ACCURACY IS PARAMOUNT**. If sources disagree, Verdict MUST be UNCERTAIN.
    2.  **PATIENT ZERO**: Attempt to find the origin. If unknown, say "Unknown".
    3.  **SOCIAL PULSE**: If specific social media data is missing in the evidence, INFER the public sentiment (e.g. 'ANGRY', 'FEARFUL') based on the tone of the news reports (e.g. "protests erupted", "users outraged"). DO NOT return 'Insufficient Data' for sentiment unless the topic is completely unknown.
    4.  **VERDICT PROTOCOL**:
        - VERIFIED: Confirmed by multiple Tier-1 sources (Reuters, AP, Gov).
        - FALSE: Explicitly debunked by fact-checkers.
        - MISLEADING: Real context twisted.
        - UNCERTAIN: Only social media sources or conflicting reports.
    5.  **TIME CONTEXT RULES (STRICT)**:
        - If event happened within the last 7 days (0-7 days ago) -> Output "Recent".
        - If event happened between 1 week and 5 months ago -> Output "Old".
        - If event happened more than 5 months ago -> Output "Very Old".

    OUTPUT JSON STRUCTURE:
    {
      "topic": "Concise Subject",
      "claim": "The specific claim being analyzed",
      "verdict": "VERIFIED" | "FALSE" | "MISLEADING" | "UNCERTAIN",
      "summary": "Detailed forensic analysis of the event, context, and verification status (approx 150 words). Provide depth.",
      "confidenceScore": number (0-100),
      "timeContext": "Recent" | "Old" | "Very Old",
      "detectedLanguage": "English",
      "socialPulse": {
          "sentiment": "ANGRY" | "HAPPY" | "NEUTRAL" | "FEARFUL",
          "score": number,
          "topNarrative": "What people are saying (Infer if necessary)",
          "hotSpots": ["Twitter", "Reddit", "News", "TikTok"]
      },
      "patientZero": {
          "platform": "Specific Platform or 'Unknown'",
          "username": "Specific Handle or 'Anonymous'",
          "timestamp": "Date/Time of origin or 'Unknown'",
          "contentFragment": "Snippet of original claim",
          "estimatedReach": "e.g. 'High', 'Viral', 'Niche'"
      },
      "timeline": [
          { "date": "YYYY-MM-DD", "description": "Event description", "source": "Source Name" }
      ],
      "psychologicalTriggers": ["Fear", "Urgency", "Tribalism", "Hope"],
      "beneficiaries": ["Who benefits? e.g. 'Political Rivals', 'Scammers'"],
      "keyEvidence": [
        { "point": "Evidence point 1", "type": "SUPPORTING" | "CONTRADICTING" }
      ],
      "relatedThemes": ["Theme1", "Theme2"],
      "entities": ["Entity1", "Entity2"]
    }
    `;

    const analysis = await callGeminiWithRetry('gemini-2.5-flash', {
        contents: finalPrompt,
        config: { 
            systemInstruction: SYSTEM_INSTRUCTION, 
            responseMimeType: "application/json",
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
        }
    });

    const data = JSON.parse(analysis.text || "{}");

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: data.topic || query,
        claim: data.claim || `Investigation into "${query}"`,
        verdict: data.verdict || VerdictType.UNCERTAIN,
        summary: data.summary || "Insufficient data for summary.",
        confidenceScore: data.confidenceScore || 50,
        sourceReliability: topSources.length > 0 ? topSources[0].reliabilityScore : 0,
        sources: topSources,
        tags: data.relatedThemes || [],
        originSector,
        detectedLanguage: data.detectedLanguage || "English",
        keyEvidence: data.keyEvidence || [],
        relatedThemes: data.relatedThemes || [],
        entities: data.entities || [],
        evolutionTrace: [],
        socialPulse: data.socialPulse || { sentiment: 'NEUTRAL', score: 50, topNarrative: 'N/A', hotSpots: [] },
        timeContext: data.timeContext || "Recent",
        communityVotes: { up: 0, down: 0 },
        patientZero: data.patientZero || { platform: 'Unknown', username: 'Unknown', timestamp: 'Unknown', contentFragment: 'N/A', estimatedReach: 'Unknown' },
        timeline: data.timeline || [],
        psychologicalTriggers: data.psychologicalTriggers || [],
        beneficiaries: data.beneficiaries || []
    };

  } catch (error: any) {
    console.warn("Using Simulation Fallback due to Error:", error.message);
    return generateSimulationReport(query);
  }
};

// NEW: Semantic Search for Blockchain Ledger
export const searchLedgerSemantically = async (query: string, headlines: {id: string, text: string}[]): Promise<string[]> => {
    try {
        if (!headlines.length || !query.trim()) return [];
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
        
        const raw = response.text || "[]";
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
        CONTEXT: Topic: "${rep.topic}". Verdict: ${rep.verdict}. Facts: ${rep.summary}.
        USER QUESTION: "${msg}"
        OUTPUT JSON: { "answer": "...", "suggestedQuestions": ["..."] }
        `;

        const response = await callGeminiWithRetry('gemini-2.5-flash', {
            contents: hist.concat([{ role: 'user', parts: [{ text: contextPrompt }] }]),
            config: { responseMimeType: "application/json" }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (e: any) {
        if (e.message === "QUOTA_EXCEEDED") {
            return { 
                answer: "⚠️ **SYSTEM ALERT:** Neural Link Unstable (Quota Exceeded). I cannot process new external data at this moment, but I can access cached simulation parameters. What would you like to analyze regarding the simulated scenario?", 
                suggestedQuestions: ["What are the simulation parameters?", "Switch to Offline Mode"] 
            };
        }
        return { answer: "Secure connection disrupted.", suggestedQuestions: [] };
    }
};
export const neutralizeBias = async (txt: string) => txt; 
export const findSemanticMatch = async (q: string, list: string[]) => null;
export const analyzeBotSwarm = async (input: string) => ({ probability: 0, analysis: "", tactics: [] });
