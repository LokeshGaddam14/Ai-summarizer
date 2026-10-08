import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_CHARS = 12000; // keep the prompt small for the free tier
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

function json(body, status = 200) {
  return Response.json(body, { status });
}

// Basic guard against requests to local/private addresses (SSRF).
function isBlockedHost(hostname) {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    h === "::1" ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h) ||
    h === "0.0.0.0"
  );
}

function extractText(html) {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  $("script, style, noscript, nav, header, footer, aside, form, iframe, svg").remove();

  const root = $("article").length ? $("article").first()
    : $("main").length ? $("main").first()
    : $("body");

  const text = root.text().replace(/\s+/g, " ").trim();
  return { title, text };
}

export async function POST(req) {
  let url;
  try {
    ({ url } = await req.json());
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  let parsed;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return json({ error: "Please enter a valid http(s) URL." }, 400);
  }
  if (isBlockedHost(parsed.hostname)) {
    return json({ error: "That address is not allowed." }, 400);
  }

  if (!process.env.GROQ_API_KEY) {
    return json({ error: "Server is missing GROQ_API_KEY." }, 500);
  }

  // 1. Scrape
  let html;
  try {
    const res = await fetch(parsed.href, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SummarizerBot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return json({ error: `Could not fetch the page (status ${res.status}).` }, 502);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) return json({ error: "That URL is not an HTML page." }, 415);
    html = await res.text();
  } catch {
    return json({ error: "Could not reach that URL." }, 502);
  }

  const { title, text } = extractText(html);
  if (text.length < 50) {
    return json({ error: "Not enough readable text found on that page." }, 422);
  }

  // 2. Summarize with Groq (free tier)
  try {
    const aiRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You summarize web pages. Reply with a concise summary of 3-5 sentences in plain text, followed by nothing else.",
          },
          { role: "user", content: `Title: ${title}\n\nPage content:\n${text.slice(0, MAX_CHARS)}` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!aiRes.ok) {
      return json({ error: `AI service error (status ${aiRes.status}).` }, 502);
    }
    const data = await aiRes.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) return json({ error: "AI returned an empty response." }, 502);

    return json({ title, url: parsed.href, summary });
  } catch {
    return json({ error: "AI request failed or timed out." }, 502);
  }
}
