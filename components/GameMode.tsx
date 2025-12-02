
import React, { useState, useEffect } from 'react';

interface Question {
  id: number;
  category: 'AI_DETECTION' | 'MISINFO_TACTICS' | 'SOURCE_VERIFICATION' | 'LOGIC_CHECK';
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  protocol: string;
}

const QUESTION_POOL: Question[] = [
  {
    id: 1,
    category: 'AI_DETECTION',
    question: "SCENARIO: You are analyzing a viral photo of a massive protest in Paris. The central figure is holding a sign with perfect French text. However, when you zoom into the background crowd, the faces of the people appear 'melted' or lack defined eyes, and a police van in the distance has 6 wheels on one side.",
    options: [
      { text: "It's a low-resolution camera artifact.", isCorrect: false, feedback: "While compression can blur details, it doesn't add structural impossibilities like extra wheels or melted facial geometry." },
      { text: "It is an AI Generation (Incoherence Artifacts).", isCorrect: true, feedback: "CORRECT. AI models (like Midjourney or Flux) focus their computing power on the focal point (the main protester). They often 'hallucinate' background details, resulting in nightmarish, melted faces and structurally impossible vehicles. This is known as 'Semantic Incoherence'—the AI knows what a crowd looks like generally, but fails at the biological specifics of individual background characters." },
      { text: "It's a composite photoshop.", isCorrect: false, feedback: "Photoshop usually retains the integrity of the original source images used in the composite." }
    ],
    protocol: "FORENSIC PROTOCOL: ALWAYS ZOOM INTO THE PERIPHERY."
  },
  {
    id: 2,
    category: 'MISINFO_TACTICS',
    question: "SCENARIO: A tweet claims 'The Government just quietly passed a law to ban private car ownership by 2030!' The tweet includes a screenshot of a document header but provides no link to the bill. The user's bio says 'Truth Seeker | Anti-NWO'. The post has 50,000 retweets but verified journalists in the comments are asking for a source and getting blocked.",
    options: [
      { text: "It's a leak the media is suppressing.", isCorrect: false, feedback: "This is the 'Secret Knowledge' trap used to flatter the reader." },
      { text: "It is a 'Rage Bait' Engagement Trap.", isCorrect: true, feedback: "CORRECT. This tactic relies on high-arousal emotions (anger, fear) to bypass critical thinking. By providing a screenshot (which cannot be clicked or text-searched easily) instead of a link, the bad actor prevents easy verification. Blocking journalists is a tactic to maintain the 'echo chamber' and prevent the debunking from being seen by the followers." },
      { text: "It's true because it has 50k retweets.", isCorrect: false, feedback: "Engagement measures virality, not veracity. Bot networks can easily inflate these numbers." }
    ],
    protocol: "DEFENSE PROTOCOL: NO LINK = NO TRUST. IGNORE SCREENSHOTS OF TEXT."
  },
  {
    id: 3,
    category: 'AI_DETECTION',
    question: "SCENARIO: You receive a voicemail from your 'CEO'. The voice sounds exactly like him, using his typical jargon. He says: 'I'm in a meeting, I need you to wire $4,500 to this vendor immediately for the conference. Don't call me back, just handle it.' The audio is crystal clear with zero background noise.",
    options: [
      { text: "He is likely in a soundproof booth.", isCorrect: false, feedback: "Unlikely for a busy CEO 'in a meeting'." },
      { text: "It is an AI Voice Clone (Vishing Attack).", isCorrect: true, feedback: "CORRECT. This is 'Spectral Flatness'. Real phone calls have background hiss, room tone, and mic popping. AI-generated audio is often mathematically perfect and devoid of this 'noise floor'. Furthermore, the command 'Don't call me back' is a social engineering pressure tactic to prevent you from verifying the request via a secondary channel (Multi-Factor Authentication)." },
      { text: "He is whispering to be discreet.", isCorrect: false, feedback: "Whispering changes vocal cord vibration patterns which AI often fails to mimic correctly." }
    ],
    protocol: "DEFENSE PROTOCOL: VERIFY VIA SECONDARY CHANNEL (TEXT/SLACK)."
  },
  {
    id: 4,
    category: 'SOURCE_VERIFICATION',
    question: "SCENARIO: You find a news site 'DenverGuardian.com' reporting a shocking crime. The site looks professional, has a weather widget, and a stock ticker. However, when you click on the 'Staff' page, the photos look generic, and a 'Whois' lookup reveals the domain was registered 3 days ago.",
    options: [
      { text: "It's a new local startup.", isCorrect: false, feedback: "Legitimate news startups usually have verifiable journalists with digital footprints." },
      { text: "It is a 'Pink Slime' or Typosquatting site.", isCorrect: true, feedback: "CORRECT. 'Pink Slime' journalism refers to low-quality, automated sites designed to look like local news to gain unearned trust. A domain registered days ago reporting on major political events is a massive red flag. They often use generic templates (weather/stocks) to mimic the aesthetic of authority without doing any actual reporting." },
      { text: "It's an archived mirror.", isCorrect: false, feedback: "Archives identify themselves clearly." }
    ],
    protocol: "DEFENSE PROTOCOL: CHECK DOMAIN AGE ON WHOIS.COM."
  },
  {
    id: 5,
    category: 'LOGIC_CHECK',
    question: "SCENARIO: A video shows a politician giving a speech. The lips match the audio perfectly. However, you notice that every time they blink, their eyelids seem to 'glitch' or become transparent for a microsecond. Also, the shadow under their chin doesn't move when they turn their head.",
    options: [
      { text: "Video compression error.", isCorrect: false, feedback: "Compression causes blockiness, not specific anatomical transparency." },
      { text: "Deepfake / Neural Rendering Artifacts.", isCorrect: true, feedback: "CORRECT. Deepfake models often struggle with 'Temporal Consistency'—keeping the physics of light and shadow consistent over time. While they can sync lips (wav2lip), they often fail to render the complex occlusion of eyelids blinking or the accurate projection of shadows (Ray Tracing) as the head moves in 3D space." },
      { text: "Bad lighting setup.", isCorrect: false, feedback: "Bad lighting creates harsh shadows, it doesn't detach them from the object." }
    ],
    protocol: "FORENSIC PROTOCOL: WATCH THE SHADOWS AND BLINKS."
  }
];

export const GameMode: React.FC<{ highContrast?: boolean, onXPEarned?: (amount: number) => void }> = ({ highContrast, onXPEarned }) => {
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'LOADING' | 'START' | 'PLAYING' | 'FEEDBACK' | 'GAMEOVER'>('LOADING');
  const [feedback, setFeedback] = useState({ correct: false, text: '' });

  useEffect(() => {
    startNewSession();
  }, []);

  const startNewSession = () => {
    const shuffled = [...QUESTION_POOL];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSessionQuestions(shuffled.slice(0, 5));
    setCurrentStep(0);
    setScore(0);
    setGameState('START');
  };

  const handleAnswer = (isCorrect: boolean, text: string) => {
    setFeedback({ correct: isCorrect, text });
    if (isCorrect) setScore(s => s + 200);
    setGameState('FEEDBACK');
  };

  const nextQuestion = () => {
    if (currentStep + 1 < sessionQuestions.length) {
      setCurrentStep(s => s + 1);
      setGameState('PLAYING');
    } else {
      setGameState('GAMEOVER');
      // Trigger XP Reward
      if (onXPEarned) onXPEarned(score);
    }
  };

  const currentQ = sessionQuestions[currentStep];

  if (gameState === 'LOADING') return null;

  if (gameState === 'START') {
      return (
          <div className={`p-8 rounded-lg border-2 border-dashed flex flex-col items-center text-center ${highContrast ? 'bg-white border-black text-black' : 'bg-black/20 border-sophon-accent/30'}`}>
              <div className="text-4xl mb-4">🛡️</div>
              <h2 className={`text-xl font-bold font-mono ${highContrast ? 'text-black' : 'text-white'}`}>DAILY COGNITIVE DRILL</h2>
              <p className={`text-xs mt-2 max-w-md ${highContrast ? 'text-gray-600' : 'text-gray-400'}`}>
                  Initiate forensic training sequence. 
                  Analyze complex scenarios for AI artifacts, logic gaps, and manipulation tactics.
              </p>
              <button 
                onClick={() => setGameState('PLAYING')} 
                className={`mt-6 px-8 py-3 rounded font-bold text-xs tracking-widest transition-transform hover:scale-105 ${highContrast ? 'bg-black text-white' : 'bg-sophon-accent text-black hover:bg-white'}`}
              >
                  START DRILL
              </button>
          </div>
      );
  }

  if (gameState === 'GAMEOVER') {
      return (
          <div className={`p-8 rounded-lg border-2 text-center flex flex-col items-center animate-fadeIn ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-sophon-success'}`}>
              <h2 className="text-2xl font-bold font-mono mb-2">SESSION COMPLETE</h2>
              <div className="text-5xl font-bold text-sophon-success mb-2">{score} / 1000</div>
              <p className="text-xs mb-6 text-gray-400">RATING: {score === 1000 ? 'SOPHON ELITE' : score > 600 ? 'ANALYST' : 'TRAINEE'}</p>
              <div className="flex gap-4">
                  <div className={`px-4 py-2 rounded text-xs font-mono border ${highContrast ? 'bg-gray-200 border-black' : 'bg-sophon-success/10 border-sophon-success text-sophon-success'}`}>
                      + {score} XP EARNED
                  </div>
              </div>
              <button onClick={startNewSession} className={`mt-6 px-6 py-2 rounded font-bold text-xs ${highContrast ? 'bg-black text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                  NEW DRILL SET
              </button>
          </div>
      );
  }

  return (
    <div className={`p-6 rounded-lg border-2 relative overflow-hidden min-h-[400px] flex flex-col ${highContrast ? 'bg-white border-black text-black' : 'glass-panel border-gray-700'}`}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700/50">
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${highContrast ? 'bg-black text-white' : 'bg-white/10 text-gray-300'}`}>
                Q{currentStep + 1} / {sessionQuestions.length}
            </span>
            <span className={`text-[10px] font-bold tracking-widest ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>
                {currentQ.category.replace('_', ' ')}
            </span>
            <span className={`text-xs font-mono ${highContrast ? 'text-black font-bold' : 'text-sophon-accent'}`}>
                SCORE: {score}
            </span>
        </div>

        <h3 className={`text-sm md:text-base font-bold mb-8 leading-relaxed ${highContrast ? 'text-black' : 'text-white'}`}>
            {currentQ.question}
        </h3>

        <div className="grid gap-3 mt-auto">
            {currentQ.options.map((opt, i) => (
                <button 
                    key={i} 
                    onClick={() => handleAnswer(opt.isCorrect, opt.feedback)} 
                    disabled={gameState === 'FEEDBACK'} 
                    className={`p-4 text-left text-sm rounded border transition-all relative group ${
                        highContrast 
                            ? 'hover:bg-gray-100 border-black' 
                            : 'bg-black/40 border-white/10 hover:border-sophon-accent hover:bg-sophon-accent/10'
                    }`}
                >
                    <span className={`absolute left-4 opacity-50 font-mono text-xs ${highContrast ? 'text-black' : 'text-gray-500'}`}>{['A', 'B', 'C'][i]}.</span>
                    <span className="pl-6">{opt.text}</span>
                </button>
            ))}
        </div>

        {gameState === 'FEEDBACK' && (
            <div className={`absolute inset-0 z-20 p-8 flex flex-col items-center justify-center text-center animate-fadeIn ${highContrast ? 'bg-white' : 'bg-[#050505]/95 backdrop-blur-sm'}`}>
                <div className={`text-4xl font-bold mb-4 ${feedback.correct ? 'text-green-500' : 'text-red-500'}`}>
                    {feedback.correct ? 'CORRECT' : 'INCORRECT'}
                </div>
                <div className="max-h-[200px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
                    <p className={`text-sm max-w-lg leading-relaxed ${highContrast ? 'text-black' : 'text-gray-200'}`}>
                        {feedback.text}
                    </p>
                </div>
                <div className={`p-4 rounded border mb-8 ${highContrast ? 'bg-gray-100 border-black' : 'bg-sophon-accent/5 border-sophon-accent/30'}`}>
                    <p className="text-[10px] font-bold uppercase mb-1 text-gray-500">TACTICAL PROTOCOL</p>
                    <p className={`text-sm font-mono ${highContrast ? 'text-black' : 'text-sophon-accent'}`}>{currentQ.protocol}</p>
                </div>
                <button 
                    onClick={nextQuestion} 
                    className={`w-full max-w-xs py-3 rounded font-bold text-xs tracking-widest ${highContrast ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                    CONTINUE &rarr;
                </button>
            </div>
        )}
    </div>
  );
};
