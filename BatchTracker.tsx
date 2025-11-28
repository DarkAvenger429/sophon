import React from "react";
import CardShell from "./CardShell";

const BatchCheckModule: React.FC = () => {
  return (
    <CardShell
      title="Batch Misinformation Check"
      subtitle="Upload CSV / JSON or paste multiple URLs and texts. Wire this up to your batch endpoint."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
          gap: 16,
        }}
      >
        {/* LEFT: INPUT */}
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
            Paste multiple items
          </div>
          <textarea
            placeholder={`One item per line:
- https://example.com/article
- "Breaking: You won't believe..."
- https://another-site.com/post`}
            style={{
              minHeight: 160,
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
              fontSize: 11,
              color: "#9ca3af",
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>
              Your backend can map each line to a job and return an array of
              verdicts.
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 999,
                border: "1px solid rgba(55,65,81,1)",
              }}
            >
              Expected response: AnalysisResult[]
            </span>
          </div>

          <div
            style={{
              marginTop: 4,
              borderTop: "1px dashed rgba(31,41,55,1)",
              paddingTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Or upload a CSV / JSON file.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(55,65,81,1)",
                  background: "rgba(15,23,42,1)",
                  color: "#e5e7eb",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                📂 Upload CSV
              </button>
              <button
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(55,65,81,1)",
                  background: "rgba(15,23,42,1)",
                  color: "#e5e7eb",
                  fontSize: 11,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                📁 Upload JSON
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: RESULTS SUMMARY */}
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(55,65,81,0.9)",
            padding: 12,
            background:
              "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,0.96))",
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
            Aggregate overview (placeholder)
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Once wired, show things like:
            <ul
              style={{
                paddingLeft: 18,
                marginTop: 4,
              }}
            >
              <li>% likely reliable vs misleading</li>
              <li>Top domains flagged as suspicious</li>
              <li>Most common clickbait phrases</li>
            </ul>
          </div>
          <div
            style={{
              marginTop: "auto",
              fontSize: 11,
              color: "#9ca3af",
              borderTop: "1px dashed rgba(31,41,55,1)",
              paddingTop: 8,
            }}
          >
            Store raw results in your DB and hydrate this view from a
            `/batch/:jobId` endpoint.
          </div>
        </div>
      </div>
    </CardShell>
  );
};

export default BatchCheckModule;
