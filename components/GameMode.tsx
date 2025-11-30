
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
    question: "When analyzing an image of a crowd for AI generation, what is the most common giveaway?",
    options: [
      { text: "The lighting is too dark.", isCorrect: false, feedback: "Dark lighting is a stylistic choice in photography, not an AI artifact." },
      { text: "Faces in the background are blurred or distorted (melted).", isCorrect: true, feedback: "CORRECT. AI models optimize for the focal point. Background faces often lack coherent geometry, appearing melted or alien-like." },
      { text: "The resolution is 4K.", isCorrect: false, feedback: "High resolution is standard for modern cameras and AI upscalers alike." }
    ],
    protocol: "ZOOM IN ON BACKGROUND FACES"
  },
  {
    id: 2,
    category: 'AI_DETECTION',
    question: "You see a photo of a politician holding a sign. The text looks like alien symbols. What is this?",
    options: [
      { text: "A foreign dialect.", isCorrect: false, feedback: "Even foreign scripts have consistent structure. This is structural incoherence." },
      { text: "AI Text Hallucination.", isCorrect: true, feedback: "CORRECT. AI generates image pixels based on probability, not linguistic rules. It mimics the 'shape' of text without understanding spelling." },
      { text: "Motion blur.", isCorrect: false, feedback: "Motion blur causes direction-specific smearing, not character substitution." }
    ],
    protocol: "READ BACKGROUND TEXT & LOGOS"
  },
  {
    id: 3,
    category: 'AI_DETECTION',
    question: "Which feature is a classic 'tell' of AI-generated hands?",
    options: [
      { text: "Hands in pockets.", isCorrect: false, feedback: "Hiding hands is a common photography pose." },
      { text: "Polydactyly (too many fingers) or merging digits.", isCorrect: true, feedback: "CORRECT. AI struggles with the complex topology of overlapping fingers, often generating 6+ fingers or merging them into objects." },
      { text: "Painted fingernails.", isCorrect: false, feedback: "Nail polish is not an anomaly." }
    ],
    protocol: "COUNT THE FINGERS"
  },
  {
    id: 4,
    category: 'MISINFO_TACTICS',
    question: "What is 'Lateral Reading'?",
    options: [
      { text: "Reading a website top-to-bottom.", isCorrect: false, feedback: "That is vertical reading, which keeps you trapped in the site's own ecosystem." },
      { text: "Opening new tabs to verify the source before reading.", isCorrect: true, feedback: "CORRECT. Fact-checkers leave the site immediately to see what trusted sources say *about* the site." },
      { text: "Reading comments first.", isCorrect: false, feedback: "Comments are often manipulated by bot swarms." }
    ],
    protocol: "LEAVE THE PAGE TO VERIFY THE PAGE"
  },
  {
    id: 5,
    category: 'MISINFO_TACTICS',
    question: "A headline uses words like 'SHOCKING', 'DESTROYED', and 'YOU WON'T BELIEVE'. This is:",
    options: [
      { text: "Breaking Journalism.", isCorrect: false, feedback: "Real journalism prioritizes clarity and neutrality over emotional triggers." },
      { text: "Emotional/Rage Bait.", isCorrect: true, feedback: "CORRECT. High-arousal emotions (anger, shock) bypass critical thinking centers in the brain to force a click." },
      { text: "Satire.", isCorrect: false, feedback: "Satire relies on irony, not emotional manipulation." }
    ],
    protocol: "IDENTIFY EMOTIONAL MANIPULATION"
  },
  {
    id: 6,
    category: 'AI_DETECTION',
    question: "In AI portraits, how does skin texture typically appear?",
    options: [
      { text: "Overly smooth, plastic, or 'airbrushed'.", isCorrect: true, feedback: "CORRECT. AI models often denoise skin to the point of removing natural pores, creating a 'waxy' or plastic doll appearance." },
      { text: "Too grainy.", isCorrect: false, feedback: "Grain suggests a high ISO setting on a real camera sensor." },
      { text: "Red and blotchy.", isCorrect: false, feedback: "Imperfections usually indicate reality." }
    ],
    protocol: "LOOK FOR PORES & IMPERFECTIONS"
  },
  {
    id: 7,
    category: 'LOGIC_CHECK',
    question: "An image shows a reflection in a mirror, but the reflection doesn't match the object. Why?",
    options: [
      { text: "Vampire physics.", isCorrect: false, feedback: "Incorrect." },
      { text: "AI Physics Failure.", isCorrect: true, feedback: "CORRECT. AI does not understand light transport physics. It paints the reflection as a separate object, often forgetting to reverse text or match details." },
      { text: "Wide-angle lens.", isCorrect: false, feedback: "Lenses distort geometry but do not alter the content of a reflection." }
    ],
    protocol: "CHECK PHYSICS & REFLECTIONS"
  },
  {
    id: 8,
    category: 'MISINFO_TACTICS',
    question: "50 comments on a post are identical word-for-word. This indicates:",
    options: [
      { text: "A viral trend.", isCorrect: false, feedback: "Humans naturally vary their phrasing even when agreeing." },
      { text: "Astroturfing / Bot Swarm.", isCorrect: true, feedback: "CORRECT. 'Astroturfing' is fake grassroots support. Scripts copy-paste exact text across thousands of bot accounts." },
      { text: "Server glitch.", isCorrect: false, feedback: "Glitches usually duplicate a single user's post, not different users." }
    ],
    protocol: "SPOT THE SCRIPT"
  },
  {
    id: 9,
    category: 'SOURCE_VERIFICATION',
    question: "Which domain extension is commonly associated with 'burner' disinformation sites?",
    options: [
      { text: ".gov", isCorrect: false, feedback: "Restricted to government entities." },
      { text: ".xyz or .top", isCorrect: true, feedback: "CORRECT. These TLDs are extremely cheap ($1) and unrestricted, making them favorites for disposable fake news farms." },
      { text: ".edu", isCorrect: false, feedback: "Restricted to accredited educational institutions." }
    ],
    protocol: "CHECK THE URL EXTENSION"
  },
  {
    id: 10,
    category: 'AI_DETECTION',
    question: "In Deepfake audio, what is a common auditory flaw?",
    options: [
      { text: "Background noise.", isCorrect: false, feedback: "Real audio has noise. AI often sounds *too* clean." },
      { text: "Unnatural breathing patterns.", isCorrect: true, feedback: "CORRECT. AI models generate continuous speech but often forget the natural intake of breath required for humans to speak long sentences." },
      { text: "Low volume.", isCorrect: false, feedback: "Volume is easily adjusted and irrelevant to authenticity." }
    ],
    protocol: "LISTEN FOR THE BREATH"
  },
  {
    id: 11,
    category: 'MISINFO_TACTICS',
    question: "What is a 'Cheapfake'?",
    options: [
      { text: "A free AI tool.", isCorrect: false, feedback: "Incorrect." },
      { text: "Context-shifted media.", isCorrect: true, feedback: "CORRECT. Cheapfakes don't use AI. They use real photos/videos but re-caption them with a lie (e.g., sharing a 2015 photo as 'Breaking News')." },
      { text: "A knockoff product.", isCorrect: false, feedback: "Irrelevant." }
    ],
    protocol: "VERIFY CONTEXT, NOT JUST PIXELS"
  },
  {
    id: 12,
    category: 'AI_DETECTION',
    question: "Look at the accessories (glasses, jewelry) in a suspected AI portrait.",
    options: [
      { text: "Check for branding.", isCorrect: false, feedback: "Brands can be faked." },
      { text: "Check for asymmetry and blending.", isCorrect: true, feedback: "CORRECT. AI often merges glasses frames into the skin or generates earrings with different shapes on each ear." },
      { text: "Check for style.", isCorrect: false, feedback: "Style is subjective." }
    ],
    protocol: "CHECK SYMMETRY OF ACCESSORIES"
  },
  {
    id: 13,
    category: 'SOURCE_VERIFICATION',
    question: "A viral screenshot of a tweet has no date and no handle visible. Verdict?",
    options: [
      { text: "Share if it feels true.", isCorrect: false, feedback: "Confirmation bias makes us vulnerable to this." },
      { text: "Assume it is fake.", isCorrect: true, feedback: "CORRECT. Fabricating a tweet image takes seconds. If the link isn't provided, the tweet likely never existed." },
      { text: "Ask a friend.", isCorrect: false, feedback: "Hearsay is not verification." }
    ],
    protocol: "NO LINK = NO TRUST"
  },
  {
    id: 14,
    category: 'MISINFO_TACTICS',
    question: "What is the 'Illusion of Truth' effect?",
    options: [
      { text: "Repetition creates belief.", isCorrect: true, feedback: "CORRECT. The brain processes familiar information more easily. If you hear a lie 10 times, your brain flags it as 'true' simply because it is familiar." },
      { text: "Truth is relative.", isCorrect: false, feedback: "Incorrect." },
      { text: "AI cannot lie.", isCorrect: false, feedback: "AI frequently hallucinates." }
    ],
    protocol: "DISRUPT REPETITION"
  },
  {
    id: 15,
    category: 'AI_DETECTION',
    question: "Which feature is AI currently BEST at rendering (hardest to spot)?",
    options: [
      { text: "Hands.", isCorrect: false, feedback: "Hands remain a high-failure point." },
      { text: "Front-facing facial structure.", isCorrect: true, feedback: "CORRECT. GANs and Diffusion models have mastered facial symmetry. Never trust a face alone; look at the ears, hair, and background." },
      { text: "Text.", isCorrect: false, feedback: "Text is often garbled." }
    ],
    protocol: "DON'T TRUST THE FACE ALONE"
  },
  {
    id: 16,
    category: 'MISINFO_TACTICS',
    question: "A post says: 'Facebook is deleting this! Share before it's gone!'",
    options: [
      { text: "Helpful advice.", isCorrect: false, feedback: "Platforms remove content for Terms of Service violations, not conspiracies." },
      { text: "False Urgency Loop.", isCorrect: true, feedback: "CORRECT. Scammers create artificial urgency to trigger your 'fear of missing out' (FOMO) and bypass fact-checking." },
      { text: "Inside info.", isCorrect: false, feedback: "Unlikely." }
    ],
    protocol: "IGNORE 'SHARE NOW' COMMANDS"
  },
  {
    id: 17,
    category: 'LOGIC_CHECK',
    question: "An image shows a person holding an object, but the fingers blend into the object. This is:",
    options: [
      { text: "Clipping / Merging.", isCorrect: true, feedback: "CORRECT. A primary AI artifact where the model fails to define the boundary between two interacting objects." },
      { text: "Bad grip.", isCorrect: false, feedback: "Physics doesn't allow flesh to merge with matter." },
      { text: "Motion blur.", isCorrect: false, feedback: "Incorrect." }
    ],
    protocol: "CHECK OBJECT INTERACTION"
  },
  {
    id: 18,
    category: 'SOURCE_VERIFICATION',
    question: "Is a 'Verified' blue checkmark on X (Twitter) proof of identity?",
    options: [
      { text: "Yes, always.", isCorrect: false, feedback: "Legacy verification is gone." },
      { text: "No, it is a paid subscription.", isCorrect: true, feedback: "CORRECT. A checkmark now simply means the user has a credit card and a phone number. It confers zero authority or expertise." },
      { text: "Only for celebs.", isCorrect: false, feedback: "Incorrect." }
    ],
    protocol: "BLUE CHECK MEANS NOTHING"
  },
  {
    id: 19,
    category: 'AI_DETECTION',
    question: "What is 'Zooming and Scrolling'?",
    options: [
      { text: "A dance move.", isCorrect: false, feedback: "No." },
      { text: "A method to check AI consistency.", isCorrect: true, feedback: "CORRECT. AI images often look perfect at thumbnail size. You MUST zoom in to see the breakdown in logic (buttons, zippers, pupils)." },
      { text: "Making the image bigger.", isCorrect: false, feedback: "It is about scrutiny, not size." }
    ],
    protocol: "ALWAYS ZOOM IN"
  },
  {
    id: 20,
    category: 'MISINFO_TACTICS',
    question: "What is 'Prebunking'?",
    options: [
      { text: "Debunking later.", isCorrect: false, feedback: "That is reactive." },
      { text: "Psychological inoculation.", isCorrect: true, feedback: "CORRECT. Learning the tactics of manipulation (like this quiz) builds 'mental armor', making you resistant to future misinformation." },
      { text: "Guessing.", isCorrect: false, feedback: "Incorrect." }
    ],
    protocol: "BUILD MENTAL ARMOR"
  }
];

export const GameMode: React.FC<{ highContrast?: boolean }> = ({ highContrast }) => {
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
                  Identify AI artifacts, logic gaps, and manipulation tactics.
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
              <button onClick={startNewSession} className={`px-6 py-2 rounded font-bold text-xs ${highContrast ? 'bg-black text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
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
                XP: {score}
            </span>
        </div>

        <h3 className={`text-lg font-bold mb-8 leading-relaxed ${highContrast ? 'text-black' : 'text-white'}`}>
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
                <p className={`text-sm mb-8 max-w-lg leading-relaxed ${highContrast ? 'text-black' : 'text-gray-200'}`}>
                    {feedback.text}
                </p>
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
