import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!process.env.TAVILY_API_KEY) {
      return NextResponse.json({
        summary: 'Tavily is not configured. Set TAVILY_API_KEY to enable web search.',
        results: [],
      })
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5,
      }),
    })

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Tavily error: ${msg}`)
    }

    const data = await res.json()
    const summary = data.answer as string | undefined
    const results = (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
    }))

    return NextResponse.json({ summary, results })
  } catch (e: any) {
    console.error('[v0] /api/agent/search error:', e.message)
    return NextResponse.json({ error: e.message, summary: '', results: [] }, { status: 200 })
  }
}
