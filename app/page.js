"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>AI Web Page Summarizer</h1>
      <p className="sub">Paste a link and get a short summary of the page.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="url"
          required
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Summarize"}
        </button>
      </form>

      {loading && <div className="card loading">Loading... fetching the page and generating a summary.</div>}

      {error && <div className="card error">{error}</div>}

      {result && (
        <div className="card">
          <h2>{result.title || "Summary"}</h2>
          <p className="src">{result.url}</p>
          <p>{result.summary}</p>
        </div>
      )}
    </main>
  );
}
