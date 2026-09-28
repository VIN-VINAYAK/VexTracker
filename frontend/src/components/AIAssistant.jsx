import { useState } from 'react'
import { Bot, Send, Sparkles, X, ShieldAlert, BookOpen, AlertCircle } from 'lucide-react'
import { api } from '../services/api'

const QUICK_PROMPTS = [
  'What does a routine vaccine schedule usually include?',
  'Can my baby get vaccinated if they have a mild fever?',
  'What are normal reactions after DTaP?',
  'What is the MMR schedule and is it safe?',
  'What should I do if a dose is delayed or missed?',
]

export function AIAssistant({ isOpen, onClose }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your VexTracker Clinical AI Assistant. I provide evidence-based guidance strictly grounded in CDC, WHO, and AAP pediatric immunization standards. How can I help you today?',
      source: 'Verified Knowledge Base',
    },
  ])
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSend = async (queryText) => {
    const q = (queryText || question).trim()
    if (!q || loading) return

    const newMessages = [...messages, { role: 'user', content: q }]
    setMessages(newMessages)
    setQuestion('')
    setLoading(true)

    try {
      const res = await api.askAssistant(q)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.answer || "I don't have verified information on that.",
          source: res.source_snippet || 'Verified Clinical Source',
          category: res.category,
        },
      ])
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Unable to reach the clinical knowledge service. Please try again shortly.',
          source: 'System Error',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Pediatric Clinical AI</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                  CDC / WHO Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Deterministic RAG Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-md'
                    : 'border border-slate-800 bg-slate-950/90 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.source && (
                  <div className="mt-3 flex items-start gap-1.5 border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-300">Verified Evidence:</strong> {msg.source}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                <Sparkles className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Consulting verified clinical immunization guidelines...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-800/80 bg-slate-950/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Suggested Clinical Inquiries
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800 transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="border-t border-slate-800 bg-slate-950 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about pediatric vaccines, dosage intervals, reactions..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400 transition disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
            <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
            <span>Educational guidance only. Always confirm with your pediatrician for individual care.</span>
          </div>
        </form>
      </div>
    </div>
  )
}
