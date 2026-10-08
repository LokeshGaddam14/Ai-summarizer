# ⚡ Synapse AI — Intelligent Web Intelligence & Summarization Engine

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Groq LPUs](https://img.shields.io/badge/Inference-Groq_LPU-f55036?style=for-the-badge&logo=fastapi)](https://groq.com/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js_18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

An enterprise-grade, ultra-low latency AI summarization micro-service and web interface engineered to ingest, clean, and distill web content into dense, structured, actionable summaries in milliseconds.

Built with **Next.js 14 (App Router)**, **Cheerio DOM parsing pipeline**, and **Groq Cloud Ultra-Fast LPUs** (serving high-throughput open-weights LLMs like Qwen / Llama 3.3).

---

## 📌 Architectural Overview

```
[ User Input URL ]
        │
        ▼
[ SSRF Guard & Protocol Validator ] ───▶ (Blocks private CIDRs, LAN, loopback)
        │
        ▼
[ Headless HTTP Ingestion (AbortSignal timeout) ]
        │
        ▼
[ DOM Sanitizer & Semantic Content Extractor (Cheerio) ]
        │ (strips scripts, styles, forms, navs, headers, footers)
        ▼
[ Token-Aware Content Truncator (<12k chars context limit) ]
        │
        ▼
[ Groq Cloud Inference Pipeline (LLM Completion) ]
        │ (low temperature: 0.3 for high factual grounding)
        ▼
[ Clean JSON / Structured Summary Client Response ]
```

---

## ✨ Key Engineering Highlights

- **⚡ Sub-Second Inference Latency:** Leverages Groq's Tensor-Streaming Architecture / LPUs to achieve lightning-fast token generation times.
- **🛡️ Defensive SSRF Hardening:** Strict server-side URL sanitization mitigating SSRF (Server-Side Request Forgery) attacks by blocking requests to private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, loopbacks, AWS metadata, and local hosts).
- **🧹 Semantic DOM Distillation:** Cheerio-powered pipeline strips noise elements (`nav`, `header`, `footer`, `script`, `style`, `aside`, `forms`, `iframes`, `svg`) and isolates meaningful content containers (`article`, `main`, or semantic `body`).
- **🎯 Deterministic Prompt Engineering:** Configured with reduced temperature (`0.3`) and focused system directives for high-fidelity extraction without hallucination or meta-commentary.
- **⏱️ Resilient Execution Timeouts:** Integrated network and inference guardrails using `AbortSignal.timeout` preventing hanging connections and runaway resource consumption.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Unified edge-ready fullstack platform with optimized client/server boundary |
| **UI Layer** | React 18 & Vanilla CSS | Zero-dependency, lightweight, performant UI with responsive feedback states |
| **DOM Engine** | Cheerio | Blazing-fast server-side HTML parser, avoiding bloated headless browser memory footprints |
| **LLM Inference** | Groq API (`qwen/qwen3.8-27b` / configurable) | High tokens-per-second LPU throughput, low cost-per-query, zero cold-starts |
| **Runtime** | Node.js (v18.17+) | Native `fetch`, `AbortSignal`, and strict modern standard support |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `18.17` or higher
- **npm**, **pnpm**, or **yarn**
- **Groq API Key** (obtainable from [Groq Cloud Console](https://console.groq.com/keys))

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LokeshGaddam14/Ai-summarizer.git
   cd Ai-summarizer
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Populate your `.env` file:
   ```env
   # Required: Groq Cloud API Secret
   GROQ_API_KEY=gsk_your_groq_api_key_here

   # Optional: Custom model selection (Defaults to qwen/qwen3.8-27b)
   GROQ_MODEL=qwen/qwen3.8-27b
   ```

4. **Launch Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000) to inspect the application.

---

## 🔌 API Specification

### Summarize Endpoint

Ingests an accessible external URL, extracts core textual content, and returns an LLM-synthesized summary.

- **Route:** `POST /api/summarize`
- **Content-Type:** `application/json`

#### Request Payload
```json
{
  "url": "https://en.wikipedia.org/wiki/Artificial_intelligence"
}
```

#### Successful Response (`200 OK`)
```json
{
  "title": "Artificial intelligence - Wikipedia",
  "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
  "summary": "Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of living beings, primarily of humans. It is a field of study in computer science that develops and studies intelligent machines. Such machines may be called AIs. Major AI research areas include reasoning, knowledge representation, planning, learning, natural language processing, perception, and robotics."
}
```

#### Error Response Schemas

| HTTP Code | Condition | Example Response |
| :--- | :--- | :--- |
| `400 Bad Request` | Missing/malformed JSON body or invalid URL scheme | `{"error": "Please enter a valid http(s) URL."}` |
| `400 Bad Request` | SSRF prevention violation (Targeting private/loopback host) | `{"error": "That address is not allowed."}` |
| `415 Unsupported` | Target endpoint does not serve `text/html` | `{"error": "That URL is not an HTML page."}` |
| `422 Unprocessable`| Page content insufficient for synthesis (<50 characters) | `{"error": "Not enough readable text found on that page."}` |
| `502 Bad Gateway`  | Upstream scrape failure or Groq inference timeout | `{"error": "AI request failed or timed out."}` |

---

## 📂 Project Structure

```
├── app/
│   ├── api/
│   │   └── summarize/
│   │       └── route.js       # Core backend: SSRF validation, Cheerio scraper, Groq caller
│   ├── globals.css            # Clean, modern UI styling
│   ├── layout.js              # Root HTML/Head layout
│   └── page.js                # Interactive client-side interface with state management
├── .env.example               # Template environment configuration
├── package.json               # Dependencies and scripts definition
└── README.md                  # System documentation & technical specifications
```

---

## 🛡️ Security & Reliability Posture

1. **SSRF Mitigation:** Explicit blocking of RFC 1918 addresses, carrier-grade NATs, loopbacks, link-local addresses, and non-HTTP protocols prevents internal network sniffing.
2. **Resource Exhaustion Guardrails:** Input content is truncated to maximum safe context character windows (`MAX_CHARS = 12000`) to maintain deterministic memory bounds and strictly respect inference quotas.
3. **Graceful Error Bubbling:** Every boundary (parsing, HTTP transport, AI completions) is wrapped in isolated exception blocks with descriptive diagnostics.

---

## 🤝 Contributing

Pull requests are welcome. For major architectural changes or model benchmark upgrades, please open an issue first to discuss design trade-offs.

```bash
# Verify production build before submission
npm run build
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
