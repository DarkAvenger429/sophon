
import express from 'express';
import bodyParser from 'body-parser';
import { GoogleGenAI } from "@google/genai";
import twilio from 'twilio';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();

// 1. GLOBAL LOGGER (Debugging)
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.path} from ${req.ip}`);
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));

// CONFIGURATION
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDK2bK1HEvcNdkjrESsJlkinI9sgzqLKPQ';
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Initialize Services
let ai;
try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} catch (e) {
    console.error("Gemini Init Error:", e);
}

let client;
let MessagingResponse;

// Safe Twilio Init
try {
    if (ACCOUNT_SID && AUTH_TOKEN) {
        client = twilio(ACCOUNT_SID, AUTH_TOKEN);
        MessagingResponse = twilio.twiml.MessagingResponse;
        console.log("✅ Twilio Client Active");
    } else {
        console.warn("⚠️ Twilio Credentials Missing - Async replies will fail.");
        MessagingResponse = class { message() {} toString() { return '<Response/>'; } };
    }
} catch (e) {
    console.error("Twilio Init Error:", e);
    MessagingResponse = class { message() {} toString() { return '<Response/>'; } };
}

// IN-MEMORY CONTEXT
const USER_CONTEXT = new Map();

const GREETINGS = ['hi', 'hello', 'hey', 'namaste', 'start', 'menu', 'help', 'join', 'ss'];
const INTRO_MESSAGE = `
🛡️ *Sophon Sentinel Active.*

I verify:
1. 📝 *Text / Forwards*
2. 🖼️ *Images / Screenshots*
3. 🎤 *Voice Notes*
4. 📄 *PDF Documents*

*Forward any suspicious message to me.*
`;

// --- SYSTEM PROMPT (BULLETPROOF VERSION) ---
const SYSTEM_INSTRUCTION = `
You are Sophon, a Multimodal Intelligence Sentinel.

PROTOCOL:
1. **LANGUAGE MIRRORING (CRITICAL):**
   - Identify language of **CURRENT USER INPUT**.
   - Reply in **SAME LANGUAGE**.

2. **TEMPORAL ANALYSIS (TIME CHECK):**
   - CHECK DATES CAREFULLY.
   - If event happened > 3 years ago -> VERDICT: [🕒 VERY OLD NEWS].
   - If event happened 1 month to 3 years ago -> VERDICT: [🗓️ OLD NEWS].
   - If event happened 1 day to 1 month ago -> VERDICT: [RECENT].
   - If event is current (< 24 hours) -> VERDICT: [🔴 BREAKING].

3. **SOURCE WEIGHTING (CRITICAL):**
   - If a claim comes from a VERIFIED official account (e.g. Blue Tick Instagram/Twitter of a Govt/Celeb), treat it as HIGHLY CREDIBLE unless debunked by Reuters/AP/AFP.
   - Do NOT mark official statements as "Misleading" unless you have proof.

4. **FORMAT (STRICT & CONCISE - MAX 1000 CHARS):**
   - Use this EXACT structure. No fluff.

   *[VERDICT_EMOJI] STATUS: [VERIFIED / FALSE / MISLEADING / VERY OLD NEWS / OLD NEWS / RECENT / BREAKING]*
   *DATE:* [YYYY-MM-DD] (Of the actual event)
   *RISK:* [🔴 HIGH / 🟢 MED / 🟢 LOW]
   *CONFIDENCE:* [0-100]%

   *INTEL:*
   (2-3 sentences max. Just the facts. Explain WHY it is True/False.)

   *TL;DR:* (1 sentence summary)

   *SOURCES:*
   (List 2 Tier-1 Sources Only e.g. BBC, Reuters, Gov)
`;

// HELPER: Sleep/Retry
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callGemini(modelName, params, retries = 3) {
    if (!ai) return { text: "System Error: AI not initialized." };
    
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent({ model: modelName, ...params });
        } catch (error) {
            if (error.status === 503 || error.code === 503 || error.status === 429) {
                console.warn(`⚠️ Gemini Busy. Retrying...`);
                await sleep(2000 * (i + 1)); 
                continue;
            }
            throw error; 
        }
    }
    throw new Error("Gemini API Unresponsive");
}

// HELPER: Download Media
async function downloadMedia(url) {
    try {
        const config = {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        if (ACCOUNT_SID && AUTH_TOKEN) {
            config.auth = { username: ACCOUNT_SID, password: AUTH_TOKEN };
        }
        const response = await axios.get(url, config);
        return {
            data: Buffer.from(response.data, 'binary').toString('base64'),
            mimeType: response.headers['content-type']
        };
    } catch (error) {
        console.error(`Media Download Error: ${error.message}`);
        return null;
    }
}

// STAGE 1: VISION & DOCS
async function extractContext(base64Data, mimeType) {
    try {
        const isPdf = mimeType.toLowerCase().includes('pdf');
        const geminiMimeType = isPdf ? 'application/pdf' : mimeType;
        const prompt = isPdf 
            ? "Analyze this document. Extract the official subject, dates, and key claims. Is it official letterhead?" 
            : "Analyze this image. Extract all text. Describe the visual context. Is it a tweet/post? Who is the author? Is there a verified checkmark?";

        const response = await callGemini('gemini-2.5-flash', {
            contents: {
                parts: [
                    { inlineData: { mimeType: geminiMimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });
        return response.text;
    } catch (e) { return null; }
}

// STAGE 2: RAG
async function verifyClaim(claimText, contextHistory = "") {
    try {
        // Enforce Grounding for Truth
        const prompt = contextHistory 
            ? `HISTORY: ${contextHistory}\n\nCURRENT USER INPUT: "${claimText}"\n\nINSTRUCTION: Verify CURRENT INPUT. Match Language.` 
            : `CURRENT USER INPUT: "${claimText}"`;

        const response = await callGemini('gemini-2.5-flash', {
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        // --- TRUNCATION SAFETY ---
        let finalText = response.text || "";
        
        // Twilio limit is 1600. We cut at 1500 to be safe.
        if (finalText.length > 1500) {
            finalText = finalText.substring(0, 1490) + "... [Truncated]";
        }
        return finalText;
    } catch (error) {
        console.error("RAG Error:", error);
        return "⚠️ *Error:* System overloaded. Try again.";
    }
}

// --- ASYNC WORKER ---
async function processAndReply(body, mediaUrl, mediaType, sender, recipient) {
    try {
        let replyText = "";
        const incomingMsg = body?.trim() || "";
        const lowerMsg = incomingMsg.toLowerCase();

        // 1. GREETING / JOIN CATCHER
        if (!mediaUrl && (GREETINGS.includes(lowerMsg) || lowerMsg.startsWith('join'))) {
            replyText = INTRO_MESSAGE;
        }
        // 2. AUDIO
        else if (mediaUrl && (mediaType.startsWith('audio/') || mediaType.includes('ogg'))) {
            const media = await downloadMedia(mediaUrl);
            if (!media) replyText = "⚠️ Error downloading audio. Try again.";
            else {
                const response = await callGemini('gemini-2.5-flash', {
                    contents: {
                        parts: [
                            { inlineData: { mimeType: media.mimeType, data: media.data } },
                            { text: "Listen to this audio. Transcribe the claim, verify it using Google Search. Analyze the emotional tone. Reply in the spoken language." }
                        ]
                    },
                    config: { tools: [{ googleSearch: {} }], systemInstruction: SYSTEM_INSTRUCTION }
                });
                replyText = response.text;
                if (replyText.length > 1500) replyText = replyText.substring(0, 1490) + "... [Truncated]";
            }
        }
        // 3. IMAGE & PDF
        else if (mediaUrl && (mediaType.startsWith('image/') || mediaType.includes('pdf'))) {
            const media = await downloadMedia(mediaUrl);
            if (!media) replyText = "⚠️ Error downloading file.";
            else {
                const context = await extractContext(media.data, media.mimeType);
                const combinedQuery = `File Context: ${context}. User Caption: ${incomingMsg || 'None'}`;
                USER_CONTEXT.set(sender, combinedQuery);
                replyText = await verifyClaim(combinedQuery);
            }
        }
        // 4. TEXT
        else if (incomingMsg) {
            const history = USER_CONTEXT.get(sender) || "";
            replyText = await verifyClaim(incomingMsg, history);
            if (incomingMsg.length > 10) USER_CONTEXT.set(sender, incomingMsg);
        } else {
            replyText = "⚠️ Format not supported.";
        }

        // --- SEND ASYNC REPLY ---
        if (replyText && client) {
            console.log(`[OUTBOUND] Sending to ${sender}...`);
            const message = await client.messages.create({
                from: recipient,
                to: sender,
                body: replyText
            });
            console.log(`[OUTBOUND] Success. SID: ${message.sid} | Status: ${message.status}`);
        } else if (!client) {
            console.error("❌ Cannot reply: Twilio Client missing (Check Env Vars)");
        }

    } catch (error) {
        console.error("❌ Async Process Error:", error.message || error);
    }
}

// HEALTH CHECK
app.get('/', (req, res) => res.status(200).send('🟢 SOPHON BOT ONLINE'));

// WEBHOOK
app.post('/whatsapp', async (req, res) => {
    // 1. FAST RESPONSE to Twilio (Prevents 11200)
    try {
        const twiml = new MessagingResponse();
        res.type('text/xml').send(twiml.toString());
    } catch (e) {
        res.status(200).send('<Response></Response>');
    }

    // 2. PROCESS IN BACKGROUND
    const { Body, MediaUrl0, MediaContentType0, From, To } = req.body;
    console.log(`[MSG] From: ${From} | To: ${To} | Media: ${!!MediaUrl0}`);
    
    // Fire & Forget
    processAndReply(Body, MediaUrl0, MediaContentType0, From, To);
});

app.listen(PORT, () => {
    console.log(`🟢 SOPHON BACKEND ONLINE (PORT ${PORT})`);
});
