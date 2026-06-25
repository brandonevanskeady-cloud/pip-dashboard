# Pip Beta Intelligence Dashboard

A live product intelligence dashboard for Pip's closed beta, combining Pendo Agent Analytics signals with direct customer feedback.

## Stack
- Next.js 14 (React + TypeScript)
- Anthropic Claude API (for AI-powered dashboard updates via chat)
- Vercel (hosting)

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Anthropic API key
4. Run locally: `npm run dev`

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel project settings
4. Deploy

## Updating the dashboard

Use the chat panel in the bottom-right corner. Type any update — new customer feedback, Pendo data, status changes — and the AI will update the dashboard automatically.
