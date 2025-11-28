import React from "react";
import CardShell from "./CardShell";

const ModelPlaygroundModule: React.FC = () => {
  return (
    <CardShell
      title="Model Playground"
      subtitle="Compare different models or configurations on the same input."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 16,
        }}
      >
        {/* LEFT: INPUT + CONTROLS */}
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(55,65,81,0.9)",
            padding: 12,
            background: "rgba(15,23,42,0.98)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#e5e7eb",
              fontWeight: 500,
            }}
          >
            Input text / URL
          </div>
          <textarea
            placeholder="Paste a headline, tweet, or URL to compare models on..."
            style={{
              minHeight: 120,
              borderRadius: 12,
              border: "1px solid rgba(55,65,81,1)",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: 12,
              padding: 8,
              resize: "vertical",
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 4,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Model A
              </div>
              <select
                style={{
                  width: "100%",
                  borderRadius: 999,
                  border: "1px solid rgba(55,65,81,1)",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 12,
                  padding: "6px 10px",
                }}
              >
                <option value="text-v1">text-detector-v1</option>
                <option value="text-v2">text-detector-v2</option>
                <option value="llm">llm-misinfo-guard</option>
              </select>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Model B
              </div>
              <select
                style={{
                  width: "100%",
                  borderRadius: 999,
                  border: "1px solid rgba(55,65,81,1)",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: 12,
                  padding: "6px 10px",
                }}
              >
                <option value="text-v2">text-detector-v2</option>
                <option value="text-v1">text-detector-v1</option>
                <option value="llm">llm-misinfo-guard</option>
              </select>
            </div>
          </div>
          <button
            style={{
              marginTop: 4,
              alignSelf: "flex-start",
              borderRadius: 999,
              border: "none",
              background:
                "radial-gradient(circle at top left, #4f46e5, #6366f1)",
              color: "#e5e7eb",
              fontSize: 12,
              padding: "7px 16px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Run comparison
          </button>
        </div>

        {/* RIGHT: COMPARISON GRID */}
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(55,65,81,0.9)",
            padding: 12,
            background:
              "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,0.96))",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 8,
          }}
        >
          {["Model A", "Model B"].map((side) => (
            <div
              key={side}
              style={{
                borderRadius: 14,
                border: "1px solid rgba(31,41,55,1)",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginBottom: 2,
                }}
              >
                {side}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#e5e7eb",
                  fontWeight: 500,
                }}
              >
                Verdict: <span style={{ color: "#f97373" }}>Likely Misleading</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Confidence: 86%
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#e5e7eb",
                }}
              >
                Summary (placeholder): This is where you show a short explanation
                token from the model response.
              </div>
              <div
                style={{
                  marginTop: "auto",
                  fontSize: 10,
                  color: "#9ca3af",
                  borderTop: "1px dashed rgba(31,41,55,1)",
                  paddingTop: 6,
                }}
              >
                Wire this panel to a `/playground` endpoint that returns two
                AnalysisResult objects.
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
};

export default ModelPlaygroundModule;
