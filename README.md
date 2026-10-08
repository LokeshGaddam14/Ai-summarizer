# AI Web Page Summarizer

Paste a URL, and the app scrapes the page's text and summarizes it with a free AI model (Groq, Llama 3.3 70B).

**Live demo:** _<add your deployed link here>_

## Tech stack

- **Frontend:** React (Next.js App Router) — `app/page.js`
- **Backend:** Next.js API route — `app/api/summarize/route.js`
- **Scraping:** `fetch` + [cheerio](https://cheerio.js.org/)
- **AI:** [Groq API](https://console.groq.com) (free tier)

The frontend and backend live in one Next.js project, so a single command runs both.

## Run locally

1. **Prerequisites:** Node.js 18.17 or newer.
2. **Get a free API key:** sign up at https://console.groq.com/keys and create a key.
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create the `.env` file** in the **project root** (same folder as `package.json`):
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and set:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
5. **Start the app** (frontend + backend together):
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000, paste a URL, and click **Summarize**.

## API

`POST /api/summarize`

Request: `{ "url": "https://example.com" }`
Response: `{ "title": "...", "url": "...", "summary": "..." }`
Errors return `{ "error": "message" }` with a non-200 status.

