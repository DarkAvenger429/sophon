import React, {
  useState,
  useCallback,
  ChangeEvent,
  DragEvent,
  MouseEvent,
} from "react";

type InputType = "text" | "link" | "image";

interface Check {
  label: string;
  score: number; // 0–1
}

interface MetaInfo {
  model?: string;
  latencyMs?: number;
}

export interface AnalysisResult {
  inputType: InputType | "unknown";
  timestamp: string;
  verdict: string;
  confidence: number; // 0–1
  summary?: string;
  flags?: string[];
  checks?: Check[];
  meta?: MetaInfo;
}

interface FeedbackResponse {
  ok: boolean;
  stored?: boolean;
  timestamp?: string;
}

const MisinformationRadar: React.FC = () => {
  // Tabs / input
  const [activeTab, setActiveTab] = useState<InputType>("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileLabel, setSelectedFileLabel] = useState("No file selected.");
  const [isDragOver, setIsDragOver] = useState(false);

  // Analysis
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  // Feedback
  const [feedbackLabel, setFeedbackLabel] = useState<
    "misinformation" | "reliable" | "unsure" | ""
  >("");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  // ---------- Helpers ----------

  const handleTabClick = (tab: InputType) => {
    setActiveTab(tab);
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileLabel(
        `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`
      );
    } else {
      setSelectedFile(null);
      setSelectedFileLabel("No file selected.");
    }
  };

  const handleDropzoneClick = () => {
    const input = document.getElementById("image-input") as HTMLInputElement;
    if (input) input.click();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setSelectedFileLabel(
        `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`
      );
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ---------- Mock backend (replace with real fetch) ----------

  const mockAnalyze = useCallback(
    async (payload: any): Promise<AnalysisResult> => {
      const base: Partial<AnalysisResult> = {
        inputType: payload.type,
        timestamp: new Date().toISOString(),
      };

      if (payload.type === "text") {
        const text: string = payload.text;
        const len = text.length;
        const hasAllCaps = /[A-Z]{6,}/.test(text);
        const hasClickbait =
          /(shocking|you won’t believe|you won't believe|breaking|urgent|share before)/i.test(
            text
          );
        const confidence = Math.min(
          0.97,
          0.3 + len / 800 + (hasClickbait ? 0.2 : 0)
        );

        const verdict = hasClickbait
          ? "Likely Misleading"
          : hasAllCaps
          ? "Potentially Misleading"
          : "Likely Reliable";

        return {
          ...(base as AnalysisResult),
          verdict,
          confidence,
          summary:
            verdict === "Likely Reliable"
              ? "The language seems mostly neutral, with no obvious clickbait or emotional manipulation."
              : "The statement uses emotionally charged or sensational language that often appears in misleading content.",
          flags: [
            hasClickbait && "Clickbait-style phrases detected",
            hasAllCaps && "Excessive ALL-CAPS usage",
            len < 60 && "Very short snippet – context is missing",
          ].filter(Boolean) as string[],
          checks: [
            {
              label: "Language toxicity / emotion",
              score: hasClickbait || hasAllCaps ? 0.73 : 0.2,
            },
            { label: "Claim specificity", score: len > 140 ? 0.65 : 0.4 },
            { label: "Verifiability", score: 0.5 },
          ],
          meta: {
            model: "misinfo-detector-text-v1",
            latencyMs: 180,
          },
        };
      }

      if (payload.type === "link") {
        const url: string = payload.url;
        const isWeirdDomain = !/https?:\/\/(www\.)?(bbc|nytimes|reuters|thehindu|indianexpress|theguardian|apnews)\./i.test(
          url
        );
        const isHttp = /^http:\/\//i.test(url);
        const confidence = isWeirdDomain ? 0.84 : 0.62;

        return {
          ...(base as AnalysisResult),
          verdict: isWeirdDomain || isHttp ? "Potentially Misleading" : "Likely Reliable",
          confidence,
          summary: isWeirdDomain
            ? "The domain is not a widely recognised news outlet. Treat claims with caution and cross-check with trusted sources."
            : "This looks like a mainstream news domain, but you should still read critically and cross-check major claims.",
          flags: [
            isWeirdDomain && "Unfamiliar / low-reputation domain",
            isHttp && "Connection not secure (http instead of https)",
          ].filter(Boolean) as string[],
          checks: [
            {
              label: "Domain reputation",
              score: isWeirdDomain ? 0.82 : 0.25,
            },
            {
              label: "HTTPS / security",
              score: isHttp ? 0.7 : 0.15,
            },
            {
              label: "Metadata consistency",
              score: 0.4,
            },
          ],
          meta: {
            model: "misinfo-detector-link-v1",
            latencyMs: 240,
          },
        };
      }

      if (payload.type === "image") {
        return {
          ...(base as AnalysisResult),
          verdict: "Needs Manual Review",
          confidence: 0.55,
          summary:
            "Image-only analysis is uncertain. Use this as a first pass and compare with reverse-image search and fact-checking sites.",
          flags: [
            "Cannot verify original source without external lookup",
            "Memes and edited screenshots often carry misleading context",
          ],
          checks: [
            { label: "Image authenticity signals", score: 0.6 },
            { label: "Text overlay / meme patterns", score: 0.5 },
            { label: "Context completeness", score: 0.7 },
          ],
          meta: {
            model: "misinfo-detector-image-v0",
            latencyMs: 260,
          },
        };
      }

      return {
        ...(base as AnalysisResult),
        inputType: "unknown",
        verdict: "Unknown",
        confidence: 0.3,
        summary: "The engine could not classify this input type.",
        flags: [],
        checks: [],
      };
    },
    []
  );

  const mockSendFeedback = useCallback(
    async (payload: any): Promise<FeedbackResponse> => {
      // Replace this with your real /feedback endpoint
      console.log("Feedback payload (mock):", payload);
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        ok: true,
        stored: true,
        timestamp: new Date().toISOString(),
      };
    },
    []
  );

  // ---------- Analysis handler ----------

  const handleAnalyseClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      setIsAnalysing(true);

      let payload: any = { type: activeTab };

      if (activeTab === "text") {
        const trimmed = textInput.trim();
        if (!trimmed) {
          alert("Please paste some text to analyse.");
          return;
        }
        payload.text = trimmed;
      } else if (activeTab === "link") {
        const trimmed = urlInput.trim();
        if (!trimmed) {
          alert("Please enter a URL to analyse.");
          return;
        }
        payload.url = trimmed;
      } else if (activeTab === "image") {
        if (!selectedFile) {
          alert("Please choose an image to analyse.");
          return;
        }
        const base64 = await fileToBase64(selectedFile);
        payload.imageBase64 = base64;
      }

      const result = await mockAnalyze(payload);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Something went wrong while analysing.");
    } finally {
      setIsAnalysing(false);
    }
  };

  // ---------- Feedback handler ----------

  const handleFeedbackSubmit = async (
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    if (!analysisResult) {
      alert("Run an analysis first before sending feedback.");
      return;
    }
    if (!feedbackLabel) {
      alert("Please select how you would label this item.");
      return;
    }

    const payload = {
      label: feedbackLabel,
      notes: feedbackNotes.trim(),
      analysis: analysisResult,
    };

    try {
      setIsSendingFeedback(true);
      const res = await mockSendFeedback(payload);
      if (res.ok) {
        alert("Feedback recorded (mock). Wire this up to your DB for training data.");
        setFeedbackNotes("");
      } else {
        alert("Feedback API reported an error.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while sending feedback.");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // ---------- Verdict CSS helper ----------

  const verdictClass = () => {
    const v = (analysisResult?.verdict || "").toLowerCase();
    if (v.includes("reliable") || v.includes("not misleading")) return "safe";
    if (v.includes("likely misleading") || v.includes("false")) return "danger";
    return "warn";
  };

  const confidencePercent = Math.round(
    ((analysisResult?.confidence ?? 0) * 100)
  );

  // ---------- JSX ----------

  return (
    <div className="app">
      <header>
        <div className="title-block">
          <h1>
            <span>Misinformation Radar</span>
          </h1>
          <p>
            Analyse text, links, or images and get an instant credibility check
            powered by your ML engine.
          </p>
        </div>
        <div className="pill-label">
          <span className="pill-label-dot" />
          Real-time Analysis
        </div>
      </header>

      <main>
        {/* LEFT: INPUT */}
        <section className="card input-section">
          <div className="card-header">
            <h2>Input</h2>
            <small>Choose what you want to analyse</small>
          </div>

          <div className="tabs" id="tabs">
            <button
              className={`tab-button ${
                activeTab === "text" ? "active" : ""
              }`}
              data-tab="text"
              onClick={() => handleTabClick("text")}
            >
              <span className="icon">✍️</span>
              Text
            </button>
            <button
              className={`tab-button ${
                activeTab === "link" ? "active" : ""
              }`}
              data-tab="link"
              onClick={() => handleTabClick("link")}
            >
              <span className="icon">🔗</span>
              Link / Article
            </button>
            <button
              className={`tab-button ${
                activeTab === "image" ? "active" : ""
              }`}
              data-tab="image"
              onClick={() => handleTabClick("image")}
            >
              <span className="icon">🖼️</span>
              Image
            </button>
          </div>

          <div className="panels">
            {/* TEXT PANEL */}
            <div
              className={`panel ${activeTab === "text" ? "active" : ""}`}
              id="panel-text"
            >
              <label htmlFor="text-input">
                Paste text to check
                <code>headline, tweet, statement...</code>
              </label>
              <textarea
                id="text-input"
                placeholder="Paste or type the content you want to fact-check here..."
                value={textInput}
                onChange={handleTextChange}
              />
              <div className="helper-text">
                <span>
                  We’ll check language patterns, claims, and source hints.
                </span>
                <div className="chips">
                  <span className="chip">Clickbait</span>
                  <span className="chip">Hate / Fear</span>
                  <span className="chip">Sensational</span>
                </div>
              </div>
            </div>

            {/* LINK PANEL */}
            <div
              className={`panel ${activeTab === "link" ? "active" : ""}`}
              id="panel-link"
            >
              <label htmlFor="url-input">
                Enter news/article URL
                <code>https://example.com/story</code>
              </label>
              <input
                type="url"
                id="url-input"
                placeholder="https://news.example.com/article"
                value={urlInput}
                onChange={handleUrlChange}
              />
              <div className="helper-text">
                <span>
                  We’ll inspect the domain, metadata, and fetched article text.
                </span>
              </div>
            </div>

            {/* IMAGE PANEL */}
            <div
              className={`panel ${activeTab === "image" ? "active" : ""}`}
              id="panel-image"
            >
              <label>
                Upload an image
                <code>screenshots, memes, forwarded images...</code>
              </label>
              <div
                className={`image-dropzone ${
                  isDragOver ? "dragover" : ""
                }`}
                id="image-dropzone"
                onClick={handleDropzoneClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="image-dropzone-icon">📷</div>
                <div className="image-dropzone-title">
                  Drop image here or click to upload
                </div>
                <small>
                  Supported formats: JPG, PNG, WEBP · Max ~5MB (configurable)
                </small>
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
              <div className="selected-file" id="selected-file">
                {selectedFileLabel}
              </div>
            </div>
          </div>

          <div className="actions-row">
            <button
              className="primary-btn"
              id="analyze-btn"
              disabled={isAnalysing}
              onClick={handleAnalyseClick}
            >
              {!isAnalysing ? (
                <>
                  <span id="btn-label">Analyse</span>
                </>
              ) : (
                <>
                  <div className="spinner" id="btn-spinner" />
                  <span id="btn-label">Analysing...</span>
                </>
              )}
            </button>
            <span className="tiny-badge">
              <span className="tiny-dot" /> Prototype UI · Not legal advice
            </span>
          </div>
        </section>

        {/* RIGHT: RESULTS + FEEDBACK */}
        <section className="results-section">
          {/* ANALYSIS CARD */}
          <div className="card">
            <div className="card-header">
              <h2>Analysis</h2>
              <small>Model verdict & explanation</small>
            </div>

            {!analysisResult && (
              <div className="placeholder" id="placeholder">
                No analysis yet. Submit some text, a link, or an image to see
                the model’s verdict.
              </div>
            )}

            {analysisResult && (
              <div className="result-card" id="result-card">
                <div className="result-top">
                  <div
                    className={`verdict-pill ${verdictClass()}`}
                    id="verdict-pill"
                  >
                    <span className="status-dot" />
                    <span>
                      <strong id="verdict-label">
                        {analysisResult.verdict || "Pending"}
                      </strong>
                    </span>
                  </div>
                  <div className="confidence-wrapper">
                    <span>Confidence</span>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        id="confidence-fill"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                    <span
                      className="confidence-score"
                      id="confidence-score"
                    >
                      {confidencePercent}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="summary" id="summary">
                    {analysisResult.summary ||
                      "No explanation returned from the model. Consider logging this as a debugging case."}
                  </p>
                  <div className="flags" id="flags">
                    {(analysisResult.flags || []).map((flag) => (
                      <span key={flag} className="flag">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="checks" id="checks">
                    {(analysisResult.checks || []).map((check) => (
                      <div key={check.label} className="check-row">
                        <span>{check.label}</span>
                        <span>
                          {Math.round((check.score || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="badge-row" id="badges">
                    <span className="badge">
                      Input: {analysisResult.inputType || "unknown"}
                    </span>
                    {analysisResult.meta?.model && (
                      <span className="badge">
                        Model: {analysisResult.meta.model}
                      </span>
                    )}
                    {analysisResult.meta?.latencyMs != null && (
                      <span className="badge">
                        Latency: {analysisResult.meta.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <div className="json-view">
                    <code id="raw-json">
                      {JSON.stringify(analysisResult, null, 2)}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FEEDBACK / LABEL CARD */}
          <div className="card">
            <div className="card-header">
              <h2>Feedback / Label</h2>
              <small>Turn this into training data</small>
            </div>
            <div className="feedback-body">
              <div className="feedback-row">
                <span>
                  How would <strong>you</strong> label this item?
                </span>
                <div className="feedback-options">
                  <label>
                    <input
                      type="radio"
                      name="feedback-label"
                      value="misinformation"
                      checked={feedbackLabel === "misinformation"}
                      onChange={() => setFeedbackLabel("misinformation")}
                    />
                    <span>🚫 Misinformation</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="feedback-label"
                      value="reliable"
                      checked={feedbackLabel === "reliable"}
                      onChange={() => setFeedbackLabel("reliable")}
                    />
                    <span>✅ Reliable</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="feedback-label"
                      value="unsure"
                      checked={feedbackLabel === "unsure"}
                      onChange={() => setFeedbackLabel("unsure")}
                    />
                    <span>🤔 Not Sure</span>
                  </label>
                </div>
              </div>

              <div className="feedback-row">
                <label htmlFor="feedback-notes">
                  Optional notes
                  <code>why you picked this label</code>
                </label>
                <textarea
                  id="feedback-notes"
                  placeholder="Add quick rationale: missing context, fake image, satire, etc."
                  style={{ minHeight: 70 }}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                />
              </div>

              <div className="feedback-footer">
                <button
                  className="primary-btn"
                  id="feedback-btn"
                  disabled={isSendingFeedback}
                  onClick={handleFeedbackSubmit}
                >
                  <span id="feedback-btn-label">
                    {isSendingFeedback ? "Sending..." : "Send Feedback"}
                  </span>
                </button>
                <span className="feedback-note">
                  Feedback gets packaged with the last analysis JSON so you can
                  store it as supervised data.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>
          ⚠️ This interface is a demo. Always cross-verify with trusted
          fact-checking sources.
        </span>
        <span>
          Hook up your backend by replacing{" "}
          <code>mockAnalyze()</code> and <code>mockSendFeedback()</code>.
        </span>
      </footer>
    </div>
  );
};

export default MisinformationRadar;
