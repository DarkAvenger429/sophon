import React from "react";
import CardShell from "./CardShell";

const HistoryModule: React.FC = () => {
  const fakeRows = [
    {
      id: "JOB-1023",
      type: "text",
      verdict: "Likely Misleading",
      confidence: 0.88,
      createdAt: "2025-11-29 10:21",
    },
    {
      id: "JOB-1022",
      type: "link",
      verdict: "Likely Reliable",
      confidence: 0.72,
      createdAt: "2025-11-29 09:05",
    },
    {
      id: "JOB-1021",
      type: "image",
      verdict: "Needs Manual Review",
      confidence: 0.54,
      createdAt: "2025-11-29 08:42",
    },
  ];

  return (
    <CardShell
      title="History & Logs"
      subtitle="Stream previous analyses from your backend, filter them, and drill down."
    >
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <input
          type="text"
          placeholder="Search by ID, domain, or verdict..."
          style={{
            flex: 1,
            minWidth: 220,
            borderRadius: 999,
            border: "1px solid rgba(55,65,81,1)",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 12,
            padding: "6px 10px",
          }}
        />
        <select
          style={{
            borderRadius: 999,
            border: "1px solid rgba(55,65,81,1)",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 12,
            padding: "6px 10px",
          }}
        >
          <option value="all">All types</option>
          <option value="text">Text</option>
          <option value="link">Link</option>
          <option value="image">Image</option>
        </select>
        <select
          style={{
            borderRadius: 999,
            border: "1px solid rgba(55,65,81,1)",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: 12,
            padding: "6px 10px",
          }}
        >
          <option value="recent">Sort: Most recent</option>
          <option value="oldest">Sort: Oldest first</option>
          <option value="high_conf">
            Sort: Highest confidence (misinfo)
          </option>
        </select>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(55,65,81,0.9)",
          overflow: "hidden",
          background: "rgba(15,23,42,0.98)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead
            style={{
              background: "rgba(15,23,42,1)",
            }}
          >
            <tr>
              {["ID", "Type", "Verdict", "Confidence", "Created At"].map(
                (head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderBottom: "1px solid rgba(31,41,55,1)",
                    }}
                  >
                    {head}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {fakeRows.map((row) => (
              <tr key={row.id}>
                <td
                  style={{
                    padding: "7px 10px",
                    borderBottom: "1px solid rgba(31,41,55,1)",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {row.id}
                </td>
                <td
                  style={{
                    padding: "7px 10px",
                    borderBottom: "1px solid rgba(31,41,55,1)",
                    textTransform: "capitalize",
                    color: "#9ca3af",
                  }}
                >
                  {row.type}
                </td>
                <td
                  style={{
                    padding: "7px 10px",
                    borderBottom: "1px solid rgba(31,41,55,1)",
                  }}
                >
                  {row.verdict}
                </td>
                <td
                  style={{
                    padding: "7px 10px",
                    borderBottom: "1px solid rgba(31,41,55,1)",
                  }}
                >
                  {Math.round(row.confidence * 100)}%
                </td>
                <td
                  style={{
                    padding: "7px 10px",
                    borderBottom: "1px solid rgba(31,41,55,1)",
                    color: "#9ca3af",
                  }}
                >
                  {row.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        Wire this table to your DB / API (e.g. `/logs?limit=50`) and open a
        modal with full JSON when a row is clicked.
      </div>
    </CardShell>
  );
};

export default HistoryModule;
