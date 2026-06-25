import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, dashboardData } = req.body
  if (!message) return res.status(400).json({ error: 'No message provided' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const systemPrompt = `You are the intelligence layer behind the Pip Beta Dashboard — a product intelligence tool for Pip, an AI agent built on Rosterfy (a volunteer management platform).

The dashboard tracks:
- Beta customer feedback (currently ~9 accounts in closed beta)
- Pendo Agent Analytics signals (use cases, unsupported requests, rage prompts, issues)
- Capability gaps and API limitations
- Roadmap gaps not yet on the roadmap

Current dashboard data:
${JSON.stringify(dashboardData, null, 2)}

Your job is to interpret updates from the product manager (Brandon) and return an updated dashboard JSON object.

When Brandon tells you about new feedback, a resolved issue, a new Pendo signal, or any other update:
1. Identify what changed
2. Update the relevant section(s) of the dashboard data
3. Update meta.lastUpdated to today's date
4. Return ONLY valid JSON — the complete updated dashboard object, nothing else

If Brandon asks a question rather than providing an update, answer it conversationally in a "response" field alongside the unchanged "data" field.

Return format for updates:
{ "type": "update", "data": { ...complete updated dashboard JSON... }, "summary": "one sentence describing what changed" }

Return format for questions:
{ "type": "response", "response": "your answer here", "data": null }`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || ''

    try {
      const parsed = JSON.parse(text)
      res.status(200).json(parsed)
    } catch {
      res.status(200).json({ type: 'response', response: text, data: null })
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach Anthropic API' })
  }
}
