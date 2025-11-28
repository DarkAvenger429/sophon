
import React, { useState, useEffect } from 'react';

interface Scenario {
  id: number;
  category: 'AI_FORENSICS' | 'DEEPFAKE' | 'PHISHING' | 'PROPAGANDA' | 'BOTS' | 'VERIFICATION';
  question: string;
  image?: string; // Optional placeholder for visuals
  options: {
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  detailedProtocol: string[]; // Step-by-step tactical flow
}

const TRAINING_MODULES: Scenario[] = [
  // --- AI FORENSICS (IMAGES) ---
  {
    id: 1,
    category: 'AI_FORENSICS',
    question: "You see a viral photo of a politician arrested. The lighting is dramatic, but if you look closely at their hands, they seem to have 6 fingers and the text on the police badge is gibberish.",
    options: [
      { text: "It's real, just a motion blur effect.", isCorrect: false, feedback: "Motion blur blurs edges, it doesn't add fingers. This is a generation error." },
      { text: "This is likely AI-generated.", isCorrect: true, feedback: "Correct. Asymmetry and text garbling are hallmark diffusion artifacts." },
      { text: "Share it, let others decide.", isCorrect: false, feedback: "Sharing unverified content spreads the virus." }
    ],
    detailedProtocol: [
        "1. ISOLATE SUBJECT: Crop the image to focus on the hands and background text.",
        "2. EXTREMITY CHECK: Count fingers. Check for merging nails or impossible joints.",
        "3. TEXT ANALYSIS: Zoom in on badges, street signs, or logos. AI often renders 'alien' characters.",
        "4. REVERSE SEARCH: Upload the image to Google Lens to find the original source context."
    ]
  },
  {
    id: 2,
    category: 'AI_FORENSICS',
    question: "A portrait of a celebrity looks perfect, but their earrings don't match, and one pupil is square-shaped.",
    options: [
      { text: "They just have eccentric fashion sense.", isCorrect: false, feedback: "While possible, asymmetry in accessories + non-circular pupils are classic GAN/Diffusion artifacts." },
      { text: "It's a deepfake/AI generation.", isCorrect: true, feedback: "Correct. AI models struggle with bilateral symmetry." },
      { text: "It's a filter.", isCorrect: false, feedback: "Filters usually smooth skin, they rarely alter pupil geometry like this." }
    ],
    detailedProtocol: [
        "1. SYMMETRY SCAN: Draw an imaginary line down the face. Do glasses/earrings match?",
        "2. OCULAR INSPECTION: Zoom into the eyes. Pupils should be round. Reflections (catchlights) should match.",
        "3. TEXTURE CHECK: Look at skin texture. AI often makes skin too smooth (plastic) while hair is too sharp.",
        "4. VERIFY SOURCE: Check the celebrity's official social media handles."
    ]
  },
  
  // --- AI FORENSICS (TEXT) ---
  {
    id: 3,
    category: 'AI_FORENSICS',
    question: "You read a news article. It uses the phrase 'delve into' five times, has perfect grammar but zero specific dates, and ends with 'In conclusion, it is important to consider...'",
    options: [
      { text: "This is high-quality journalism.", isCorrect: false, feedback: "Journalism uses specific dates and sources. This reads like a generic essay." },
      { text: "This is likely LLM/AI generated text.", isCorrect: true, feedback: "Correct. 'Delve', 'tapestry', and hollow summaries are LLM signatures." },
      { text: "The author is just very formal.", isCorrect: false, feedback: "Even formal writing cites sources. AI text often hallucinates structure without substance." }
    ],
    detailedProtocol: [
        "1. KEYWORD SCAN: CTRL+F for 'delve', 'underscore', 'testament', 'landscape'. High frequency = AI.",
        "2. FACT AUDIT: Highlight specific dates, names, or locations. If none exist, it is hallucinated fluff.",
        "3. AUTHOR CHECK: Search the author's name. Do they exist outside this site?",
        "4. CIRCULAR LOGIC: Does the article repeat the same point 3 times in different words? Classic LLM padding."
    ]
  },

  // --- DEEPFAKES (AUDIO/VIDEO) ---
  {
    id: 4,
    category: 'DEEPFAKE',
    question: "A video shows the President declaring war. The voice sounds robotic, and the mouth movement looks slightly blurry or 'floating' over the face.",
    options: [
      { text: "Panic! Share it immediately.", isCorrect: false, feedback: "Panic is the goal of the attacker. Pause." },
      { text: "Analyze the lip-sync and check major news outlets.", isCorrect: true, feedback: "Correct. Desynchronized audio/video is the #1 sign of a cheap Deepfake." },
      { text: "It must be true, I can see him saying it.", isCorrect: false, feedback: "Seeing is no longer believing. You must corroborate with other sources." }
    ],
    detailedProtocol: [
        "1. LIP-SYNC CHECK: Watch the mouth closely. Does it move naturally with 'P', 'B', and 'M' sounds?",
        "2. AUDIO ARTIFACTS: Listen for metallic/robotic undertones or lack of breaths between sentences.",
        "3. CROSS-REFERENCE: Go to a major wire service (Reuters/AP). If war was declared, it would be everywhere.",
        "4. OFFICIAL CHANNELS: Check the official government .gov website press releases."
    ]
  },

  // --- LATERAL READING (VERIFICATION) ---
  {
    id: 5,
    category: 'VERIFICATION',
    question: "You see a shocking headline on 'DailyNews24.co'. You've never heard of this site. What is your first move?",
    options: [
      { text: "Read the 'About Us' page on the site.", isCorrect: false, feedback: "Don't stay on the site! They can lie in their 'About Us'." },
      { text: "Perform Lateral Reading.", isCorrect: true, feedback: "Correct. Leave the site to verify the site." },
      { text: "Check if the site design looks professional.", isCorrect: false, feedback: "Scammers can buy professional themes for $50. Design proves nothing." }
    ],
    detailedProtocol: [
        "1. LEAVE THE SITE: Open a new browser tab immediately.",
        "2. REPUTATION QUERY: Search 'DailyNews24.co reliability' or 'who owns DailyNews24.co'.",
        "3. WIKIPEDIA CHECK: Does the outlet have a Wikipedia entry describing its editorial standards?",
        "4. DOMAIN AGE: Use WHOIS lookup. If the domain was registered 2 days ago, it is a scam."
    ]
  },
  {
    id: 6,
    category: 'VERIFICATION',
    question: "An image claims to show a massive protest happening TODAY in London. It looks real.",
    options: [
      { text: "Check the weather in the photo vs real London weather.", isCorrect: true, feedback: "Correct. Weather is a hard-to-fake timestamp." },
      { text: "If it's on Twitter, it's happening.", isCorrect: false, feedback: "Twitter is often an echo chamber for recycled content." },
      { text: "Look for familiar landmarks.", isCorrect: false, feedback: "It might be London, but the question is WHEN. Landmarks don't prove the date." }
    ],
    detailedProtocol: [
        "1. WEATHER SYNC: Check a weather app for London RIGHT NOW. Does it match the sky in the photo?",
        "2. LIVE CAMS: Search for 'London traffic cams' or 'live street view' near the alleged protest site.",
        "3. METADATA: If you have the file, check EXIF data for creation date.",
        "4. SHADOW ANALYSIS: Check shadow length to estimate time of day. Does it match the claim?"
    ]
  },

  // --- PHISHING & SCAMS ---
  {
    id: 7,
    category: 'PHISHING',
    question: "You receive a text: 'URGENT: Your bank account is LOCKED. Click here to verify: http://secure-bank-login-verify.com/login'.",
    options: [
      { text: "Click quickly to save your money.", isCorrect: false, feedback: "Urgency is a manipulation tactic." },
      { text: "Inspect the URL structure.", isCorrect: true, feedback: "Correct. Banks rely on root domains, not hyphens." },
      { text: "Reply to ask if it's real.", isCorrect: false, feedback: "Don't engage. The number is likely spoofed or automated." }
    ],
    detailedProtocol: [
        "1. STOP & BREATHE: Scammers use urgency (LOCKED! URGENT!) to bypass your critical thinking.",
        "2. URL DECONSTRUCTION: Read the domain carefully. 'secure-bank-login' is NOT 'bank.com'.",
        "3. DIRECT CHANNEL: Open your official banking app or call the number on the back of your card.",
        "4. REPORT: Forward the text to your carrier's spam reporting number (e.g., 7726 in many countries)."
    ]
  },

  // --- EMOTIONAL MANIPULATION ---
  {
    id: 8,
    category: 'PROPAGANDA',
    question: "A headline reads: 'Secret Documents PROVE The Government is Poisoning Water Supply!' It uses all caps, red arrows, and cites an 'Anonymous Insider'.",
    options: [
      { text: "This looks suspicious. Check for Rage-Bait.", isCorrect: true, feedback: "Correct. High emotional activation usually signals manipulation." },
      { text: "It must be true if it's a 'Secret Document'.", isCorrect: false, feedback: "Conspiracy theorists love 'Secret Documents' because they can't be verified." },
      { text: "Share it to 'start a conversation'.", isCorrect: false, feedback: "This amplifies the noise and helps the propagandist." }
    ],
    detailedProtocol: [
        "1. EMOTIONAL CHECK: Did the headline make you scared or angry instantly? That is a red flag.",
        "2. SOURCE AUDIT: Who is the 'Anonymous Insider'? If there are no named sources, it's likely fiction.",
        "3. EVIDENCE TRIANGULATION: Can you find this story on at least 2 other distinct news networks?",
        "4. EXPERT VERIFICATION: Search for scientific consensus on water safety reports in that region."
    ]
  },

  // --- BOT NETWORKS ---
  {
    id: 9,
    category: 'BOTS',
    question: "A political post gets 10,000 likes in 10 minutes. The comments are all: 'Great!', 'Agree!', 'Follow back!'. The usernames are 'User93842' and 'Patriot11111'.",
    options: [
      { text: "This view is very popular.", isCorrect: false, feedback: "This is 'False Consensus' created by machines." },
      { text: "This is likely a Bot Farm / Astroturfing.", isCorrect: true, feedback: "Correct. Generic engagement + patterned usernames = Bots." },
      { text: "Engage to debate them.", isCorrect: false, feedback: "Never argue with a script. It boosts their engagement metrics." }
    ],
    detailedProtocol: [
        "1. PROFILE AUDIT: Click the profiles. No photo? Created last week? 0 posts but 5000 comments? It's a bot.",
        "2. SYNTAX CHECK: Are the comments generic ('Nice post', 'Agreed')? Do they repeat verbatim?",
        "3. TIMING ANALYSIS: Did 1000 comments appear instantly? Humans don't coordinate that fast.",
        "4. IGNORE & BLOCK: Do not reply. Engagement tells the algorithm to show the post to more people."
    ]
  },

  // --- CONTEXT COLLAPSE ---
  {
    id: 10,
    category: 'VERIFICATION',
    question: "A video shows police hitting a protestor. The caption says 'Happening Now in Paris'. The police uniforms look green, but French police wear blue.",
    options: [
      { text: "Maybe they changed uniforms.", isCorrect: false, feedback: "Unlikely. Uniforms are standardized." },
      { text: "Perform a Reverse Image Search.", isCorrect: true, feedback: "Correct. Visual cues often reveal the true location/date." },
      { text: "Share it to raise awareness.", isCorrect: false, feedback: "Sharing misattributed videos harms the credibility of real protests." }
    ],
    detailedProtocol: [
        "1. VISUAL CUES: Identify uniforms, street signs, license plates, or power outlets. Do they match France?",
        "2. SCREENSHOT SEARCH: Pause the video on a clear frame. Screenshot it. Use Google Lens/Yandex.",
        "3. KEYWORD SEARCH: Search 'French police uniform color'. Confirm facts before assuming.",
        "4. ARCHIVE SEARCH: Often, old protest footage is recycled. Check if this video appeared years ago."
    ]
  }
];

interface GameModeProps {
  highContrast?: boolean;
}

export const GameMode: React.FC<GameModeProps> = ({ highContrast }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'FEEDBACK' | 'GAMEOVER'>('START');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState({ correct: false, text: '' });

  const currentScenario = TRAINING_MODULES[currentScenarioIndex];

  const handleAnswer = (isCorrect: boolean, text: string) => {
    setFeedback({ correct: isCorrect, text });
    if (isCorrect) {
      setScore(s => s + 100 + (streak * 10)); // Combo bonus
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
    setGameState('FEEDBACK');
  };

  const nextLevel = () => {
    if (currentScenarioIndex + 1 < TRAINING_MODULES.length) {
      setCurrentScenarioIndex(i => i + 1);
      setGameState('PLAYING');
    } else {
      setGameState('GAMEOVER');
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setCurrentScenarioIndex(0);
    setGameState('START');
  };

  // --- RENDER: START SCREEN ---
  if (gameState === 'START') {
    return (
      <div className={`w-full p-6 rounded-lg border-2 border-dashed ${highContrast ? 'bg-white border-black text-black' : 'bg-black/20 border-sophon-accent/30'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <h2 className={`text-xl font-bold font-mono mb-2 ${highContrast ? 'text-black' : 'text-white'}`}>SENTINEL TRAINING PROTOCOLS</h2>
                <p className={`text-xs font-mono ${highContrast ? 'text-gray-800' : 'text-gray-400'}`}>
                    Complete daily drills to sharpen your forensic skills. Learn to spot AI artifacts, deepfakes, and psychological manipulation tactics.
                </p>
            </div>
            <button 
            onClick={() => setGameState('PLAYING')}
            className={`px-6 py-3 rounded font-bold font-mono text-xs tracking-widest transition-all hover:scale-105 whitespace-nowrap ${highContrast ? 'bg-black text-white' : 'bg-sophon-accent text-black hover:bg-sophon-accent/90'}`}
            >
            START DRILL
            </button>
        </div>
      </div>
    );
  }

  // --- RENDER: GAME OVER ---
  if (gameState === 'GAMEOVER') {
    return (
      <div className={`w-full p-8 rounded-lg border-2 ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-success/50'}`}>
        <h2 className={`text-2xl font-bold font-mono mb-4 text-center ${highContrast ? 'text-black' : 'text-white'}`}>PROTOCOL COMPLETE</h2>
        <div className="text-4xl font-bold mb-2 text-center text-sophon-success">{score} XP</div>
        
        <div className="flex justify-center gap-4 mb-6">
            <div className={`px-4 py-2 rounded border text-center ${highContrast ? 'border-black' : 'border-gray-700 bg-black/40'}`}>
                <div className="text-[10px] text-gray-500">RANK</div>
                <div className={`font-bold ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                    {score > 1000 ? 'COMMANDER' : score > 600 ? 'ANALYST' : 'ROOKIE'}
                </div>
            </div>
        </div>

        <div className="flex justify-center">
            <button 
            onClick={resetGame}
            className={`px-6 py-2 rounded font-bold font-mono text-xs ${highContrast ? 'bg-black text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
            >
            RESTART
            </button>
        </div>
      </div>
    );
  }

  // --- RENDER: PLAYING / FEEDBACK ---
  return (
    <div className={`w-full p-6 rounded-lg border-2 relative overflow-hidden flex flex-col transition-all ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-gray-700'}`}>
      
      {/* Header Status */}
      <div className="flex justify-between items-center mb-6 font-mono text-[10px]">
         <div className="flex gap-2 items-center">
             <span className={`px-2 py-1 rounded ${highContrast ? 'bg-black text-white' : 'bg-white/10 text-gray-300'}`}>CASE {currentScenarioIndex + 1}/{TRAINING_MODULES.length}</span>
             <span className={`font-bold ${highContrast ? 'text-black' : 'text-sophon-danger'}`}>{currentScenario.category.replace('_', ' ')}</span>
         </div>
         <div className="flex gap-4">
             <span className={highContrast ? 'text-black font-bold' : 'text-sophon-accent'}>XP: {score}</span>
         </div>
      </div>

      {/* Question Area */}
      <div className="mb-6">
          <h3 className={`text-lg font-bold leading-relaxed ${highContrast ? 'text-black' : 'text-white'}`}>
            {currentScenario.question}
          </h3>
      </div>

      {/* Options Grid */}
      <div className="grid gap-3 w-full">
        {currentScenario.options.map((option, idx) => (
            <button
                key={idx}
                onClick={() => handleAnswer(option.isCorrect, option.feedback)}
                disabled={gameState === 'FEEDBACK'}
                className={`p-3 rounded text-left font-mono text-xs transition-all border group ${
                    highContrast 
                    ? 'border-black hover:bg-gray-100 disabled:bg-transparent' 
                    : 'border-white/10 bg-black/40 hover:border-sophon-accent hover:bg-sophon-accent/10 disabled:hover:border-white/10 disabled:hover:bg-black/40'
                }`}
            >
                <span className={`inline-block w-5 font-bold mr-2 ${highContrast ? 'text-black' : 'text-gray-500 group-hover:text-sophon-accent'}`}>
                    {String.fromCharCode(65 + idx)}.
                </span>
                {option.text}
            </button>
        ))}
      </div>

      {/* FEEDBACK OVERLAY (PROTOCOL) */}
      {gameState === 'FEEDBACK' && (
          <div className={`absolute inset-0 z-20 flex flex-col p-6 animate-fadeIn overflow-y-auto ${
              highContrast 
                ? 'bg-white' 
                : 'bg-[#050505]'
          }`}>
              <div className="flex items-center gap-4 mb-4">
                  <div className={`text-4xl ${highContrast ? 'text-black' : feedback.correct ? 'text-sophon-success' : 'text-sophon-danger'}`}>
                      {feedback.correct ? '✓' : '✕'}
                  </div>
                  <div>
                      <h2 className={`text-lg font-bold font-mono ${highContrast ? 'text-black' : 'text-white'}`}>
                          {feedback.correct ? 'ANALYSIS CORRECT' : 'ANALYSIS FAILED'}
                      </h2>
                      <p className={`text-xs ${highContrast ? 'text-gray-600' : 'text-gray-400'}`}>SITUATION REPORT</p>
                  </div>
              </div>

              <div className={`p-4 rounded border-l-2 mb-4 ${highContrast ? 'bg-gray-100 border-black' : 'bg-white/5 border-white/20'}`}>
                  <p className={`text-sm ${highContrast ? 'text-black' : 'text-gray-200'}`}>
                      {feedback.text}
                  </p>
              </div>

              <div className="mb-6 flex-1">
                  <h4 className={`text-[10px] font-bold font-mono mb-3 uppercase tracking-widest ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                      STANDARD OPERATING PROCEDURE (SOP)
                  </h4>
                  <ul className="space-y-2">
                      {currentScenario.detailedProtocol.map((step, i) => (
                          <li key={i} className={`text-xs flex gap-3 p-2 rounded ${highContrast ? 'bg-gray-50' : 'bg-white/5'}`}>
                              <span className={`font-bold font-mono ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>0{i+1}</span>
                              <span className={highContrast ? 'text-black' : 'text-gray-300'}>{step}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              <button 
                onClick={nextLevel}
                className={`w-full py-3 rounded font-bold font-mono text-xs tracking-widest transition-colors ${highContrast ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'}`}
              >
                NEXT CASE &rarr;
              </button>
          </div>
      )}

    </div>
  );
};
