import { NextResponse, type NextRequest } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { groq } from '@ai-sdk/groq'

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

type Body = {
  action: 'chat' | 'edit'
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  selection?: string
  instruction?: 'shorten' | 'expand' | 'paraphrase' | 'table'
  apiKeys?: { openai?: string; groq?: string }
  provider?: 'openai' | 'groq'
}

function getModelFor(provider: 'openai' | 'groq') {
  if (provider === 'groq') {
    return groq(GROQ_MODEL) // uses process.env.GROQ_API_KEY
  }
  return openai(OPENAI_MODEL) // uses process.env.OPENAI_API_KEY
}

function resolveProviderOrder(preferred?: 'openai' | 'groq') {
  const hasGroq = !!process.env.GROQ_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  const order: Array<'groq' | 'openai'> = []

  if (preferred === 'groq' && hasGroq) order.push('groq')
  if (preferred === 'openai' && hasOpenAI) order.push('openai')

  // default preference: Groq first if available, then OpenAI
  if (hasGroq && !order.includes('groq')) order.push('groq')
  if (hasOpenAI && !order.includes('openai')) order.push('openai')

  return order
}

function isAuthKeyError(err: any) {
  const msg = (err?.message || '').toLowerCase()
  return (
    err?.status === 401 ||
    msg.includes('incorrect api key') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthorized')
  )
}

export async function POST(req: NextRequest) {
  console.log('/api/ai request received')

  try {
    const body = (await req.json()) as Body
    if (!body?.action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    console.log('/api/ai action:', body.action)

    const providerOrder = resolveProviderOrder(body.provider)
    if (providerOrder.length === 0) {
      return NextResponse.json(
        {
          error:
            'No AI provider configured. Add GROQ_API_KEY or OPENAI_API_KEY in Project Settings.',
        },
        { status: 500 }
      )
    }

    async function runWithFallback<T>(
      runner: (provider: 'openai' | 'groq') => Promise<T>
    ): Promise<T> {
      let lastErr: any
      for (const p of providerOrder) {
        try {
          console.log('/api/ai using provider:', p)
          return await runner(p)
        } catch (e: any) {
          lastErr = e
          console.warn('provider failed:', p, e?.message)
          if (!isAuthKeyError(e)) {
            // Non-auth errors shouldn't silently fall back; bubble up
            throw e
          }
          // else try next provider
        }
      }
      // exhausted providers
      throw lastErr
    }

    if (body.action === 'chat') {
      const conversation = (body.messages || [])
        .map(
          (m) =>
            `${m.role === 'assistant' ? 'Assistant' : m.role === 'system' ? 'System' : 'User'}: ${m.content}`
        )
        .join('\n')

      const result = await runWithFallback(async (provider) => {
        const { text } = await generateText({
          model: getModelFor(provider),
          system: `You are a helpful assistant. Always respond with detailed, informative content using semantic HTML only. Structure your response as:
          - 2-3 substantial <p> paragraphs (3-4 sentences each) with comprehensive information
          - A <ul> with 4-6 detailed <li> bullet points providing specific insights, facts, or actionable information
          - No markdown syntax, just clean HTML tags
          - Be thorough and provide valuable, detailed information`,
          prompt: `Conversation so far:\n${conversation}\n\nRespond to the latest message with comprehensive, detailed information using the required HTML structure.`,
          maxOutputTokens: 1000,
        })
        return text
      })

      console.log('/api/ai chat response length:', result.length)
      return NextResponse.json({ text: result, html: result })
    }

    // action === "edit"
    const selection = (body.selection || '').trim()
    const instruction = body.instruction
    if (!selection || !instruction) {
      return NextResponse.json({ error: 'Missing selection or instruction' }, { status: 400 })
    }

    console.log('/api/ai edit:', instruction, 'on selection length:', selection.length)

    const promptBase = `Selection:\n"""${selection}"""\n\nInstruction: ${instruction}`

    const sys =
      instruction === 'shorten'
        ? 'Rewrite the selection to be more concise while preserving all key meaning and important details. Return only the revised text, no explanations.'
        : instruction === 'expand'
          ? 'Expand the selection with additional relevant details, examples, or context. Add 2-3 more sentences with valuable information. Return only the expanded text, no explanations.'
          : instruction === 'paraphrase'
            ? 'Rewrite the selection using different wording while maintaining the exact same meaning and tone. Return only the paraphrased text, no explanations.'
            : 'Convert the selection into a well-structured HTML table. If the text contains lists or key-value pairs, organize them logically with appropriate headers. Return only valid HTML table markup (table/thead/tbody/tr/th/td tags).'

    const suggestion = await runWithFallback(async (provider) => {
      const { text } = await generateText({
        model: getModelFor(provider),
        system: sys,
        prompt: promptBase,
        maxOutputTokens: 800,
      })
      return text.trim()
    })

    console.log('/api/ai edit result length:', suggestion.length)
    return NextResponse.json({ suggestion, text: suggestion })
  } catch (e: any) {
    console.error('/api/ai error:', e?.message)
    return NextResponse.json(
      {
        error:
          e?.message ||
          'AI route error. If you set OPENAI_API_KEY and still see this, add GROQ_API_KEY as a fallback or verify the key.',
      },
      { status: e?.status === 401 ? 401 : 500 }
    )
  }
}
