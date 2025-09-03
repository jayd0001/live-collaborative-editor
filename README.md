# Collaborative AI Editor (Next.js)

A collaborative, AI‑assisted text editor built on Next.js (App Router) and shadcn/ui. The assistant inserts responses directly into the editor (not the chat), formats content as well‑documented text (justified paragraphs, spacing, and clean bullet points), and includes a “Convert to Table” action that turns comma‑separated lines into a structured table.

- Default assistant greeting is shown in chat once; subsequent AI responses appear only inside the editor.
- Chat panel supports vertical scroll for long conversations.
- Editor styles are tuned for readability and documentation‑like output.

## Table of Contents

- Summary
- Features
- Tech Stack
- Architecture Overview
- Environment Variables
- APIs Used
- Local Development (Quick Start)
- Usage Guide
- Provider Selection
- API Endpoint Example
- Deployment (Vercel)
- Security & Privacy
- Accessibility & Styling
- Troubleshooting
- FAQ
- License

## Summary

This app provides a focused writing environment that blends rich‑text editing with an embedded AI assistant. Users type prompts in the chat; the AI’s answer is inserted as clean, readable content in the editor. Lists, paragraphs, and tables render in a documentation‑friendly way to improve scannability and comprehension.

## Features

- AI responses render only in the editor, not in the chat
- Well‑documented output
  - Justified paragraphs
  - Comfortable spacing between paragraphs
  - Proper bullet and numbered lists
- “Convert to Table” from CSV‑like text (no raw HTML table injection)
- Scrollable chat panel for longer histories
- Modern, accessible UI with shadcn/ui and Tailwind CSS v4

## Tech Stack

- Framework: Next.js (App Router, React Server Components)
- Language: TypeScript
- Styling: Tailwind CSS v4 + shadcn/ui
- Editor: TipTap‑based rich editor (custom toolbars and behaviors)
- AI: Provider‑agnostic via a single API route (`app/api/ai/route.ts`)
- Utilities: `cn()` helper, assorted editor and chat hooks

Project structure (high‑level):

- app/
  - api/ai/route.ts — AI endpoint
  - page.tsx — main shell (editor + chat)
- components/
  - editor/\* — editor, toolbars, preview modal
  - chat/\* — chat sidebar UI
  - ui/\* — shadcn/ui components
- hooks/
  - use-chat.tsx — chat state and sending prompts
  - use-editor-bridge.tsx — helpers to insert AI output
  - use-ai-edits.ts — AI formatting helpers (paragraphs, lists, table conversion)
- lib/
  - utils.ts — utility helpers (e.g., `cn`)

## Architecture Overview

- Chat input captures the user’s prompt.
- Server route (`/api/ai`) calls an AI provider (OpenAI or Groq) and optionally augments with Tavily search.
- The response text is not appended to chat; instead, it’s inserted into the editor as:
  - Multiple paragraphs with spacing and justification
  - Proper bullet/numbered lists when patterns match
- “Convert to Table” parses comma‑separated lines in the current selection and creates a TipTap table node.

## Environment Variables

Create a `.env.local` file at the project root (git‑ignored) and add the keys below. Restart the dev server after changes.

```
# Required API keys (provide at least one AI key: OpenAI or Groq)
OPENAI_API_KEY=sk-your-openai-key
GROQ_API_KEY=groq-your-groq-key
TAVILY_API_KEY=tvly-your-tavily-key

# Optional model selections
OPENAI_MODEL=gpt-4o-mini
GROQ_MODEL=llama-3.1-70b-versatile
```

Notes:

- Access env vars on the server via `process.env.*`. Do not expose secrets to the client. To expose non‑sensitive values to the browser, prefix with `NEXT_PUBLIC_`.
- On Vercel, set the same variables in Project Settings → Environment Variables (no `.env` file needed).

## APIs Used

1. OpenAI — `OPENAI_API_KEY`

- What it’s for: General‑purpose text generation (drafting, editing, summarizing).
- How we use it: Generate editor‑ready paragraphs and lists that are inserted into the editor.
- Optional model: `OPENAI_MODEL` (e.g., `gpt-4o`, `gpt-4o-mini`).

2. Groq — `GROQ_API_KEY`

- What it’s for: High‑throughput, low‑latency LLM inference (e.g., Llama 3.x).
- How we use it: Fast, cost‑effective responses for outlining and structured editing tasks.
- Optional model: `GROQ_MODEL` (e.g., `llama-3.1-70b-versatile`).

3. Tavily — `TAVILY_API_KEY`

- What it’s for: Web search and retrieval, providing up‑to‑date context and sources.
- How we use it: When the AI needs current information, we first query Tavily and pass the findings to the model before writing into the editor.

Your app can be configured to use one or more providers depending on your logic in `app/api/ai/route.ts`.

## Local Development (Quick Start)

```
# 1) Install dependencies
npm install
# or
pnpm install

# 2) Create .env.local and add API keys (see above)

# 3) Run the dev server
npm run dev

# 4) Open the app
# http://localhost:3000
```

## Usage Guide

- Type a prompt in the chat input (e.g., “Summarize this selection” or “Draft a section about X”).
- AI output is inserted into the editor (not the chat) as well‑formatted paragraphs and lists.
- Convert to Table:
  - Select text formatted as CSV‑like lines:
    ```
    Name, Role, Location
    Alice, Designer, Berlin
    Bob, Engineer, Austin
    ```
  - Click “Convert to Table” in the editor toolbar. A structured table is inserted.

## Provider Selection

The project supports OpenAI and Groq. Typical strategies:

- Environment‑based: choose provider by the presence of `OPENAI_API_KEY` or `GROQ_API_KEY`.
- Model‑based: route to OpenAI if `OPENAI_MODEL` is set, otherwise Groq if `GROQ_MODEL` is set.
- Request‑based: allow a request flag (e.g., `provider: "groq"`) in the API payload to choose per‑call.

Adjust `app/api/ai/route.ts` to implement your preferred selection logic.

## Deployment (Vercel)

- Push this repository to GitHub.
- Import the repo into Vercel.
- Add the same environment variables in Project Settings → Environment Variables.
- Deploy.

## Accessibility & Styling

- Uses semantic HTML in layout headers, main, and UI controls.
- Tailwind v4 with shadcn/ui ensures consistent tokens and components.
- Editor output:
  - Paragraphs are justified and spaced (`.ProseMirror p + p { margin-top: 0.75rem; }`).
  - Lists have appropriate indentation and vertical rhythm.

## Troubleshooting

- AI returns 401/403:
  - Verify the correct API key is set and not expired.
  - Check your usage limits/quota.
- No AI text in editor:
  - Confirm `/api/ai` responds in dev tools.
  - Ensure `OPENAI_API_KEY` or `GROQ_API_KEY` is set and the server was restarted after adding `.env.local`.
- Styles look off:
  - Ensure Tailwind is active and `app/globals.css` is loaded.
  - Verify the editor container is visible and not clipped.
