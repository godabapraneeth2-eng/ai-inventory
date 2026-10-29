import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bot, Send, Sparkles, User } from 'lucide-react';
import { sendChatMessage } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';

const suggestions = [
  'Why was this order delayed?',
  'Show me inventory shortages',
  'Explain payment risk for high-risk orders',
  'Show recent orders and revenue',
];

export function AIAssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setInput('');
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { answer, context } = await sendChatMessage(question);
      setMessages(prev => [...prev, { role: 'assistant', content: answer, context }]);
    } catch {
      setError('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in flex h-[calc(100vh-8rem)] flex-col">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-500">Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">AI assistant</h1>
        <p className="mt-1 text-sm text-secondary">Ask about orders, inventory, risk, or revenue. Every answer is grounded in live database records.</p>
      </div>

      <div ref={scrollRef} className="glass-card mt-5 flex-1 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="gradient-hero flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-blue-500/20"><Sparkles size={26} /></div>
            <h2 className="mt-5 text-lg font-semibold text-primary">Ask Nexus AI anything</h2>
            <p className="mt-2 max-w-sm text-sm text-secondary">I can explain order delays, inventory shortages, payment risks, and revenue summaries — all backed by real data.</p>
            <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => ask(s)} className="rounded-xl border border-app bg-surface-hover/50 p-3 text-left text-xs text-secondary transition hover:border-blue-500/30 hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} mb-4`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.role === 'user' ? 'bg-blue-500/10 text-blue-500' : 'gradient-hero text-white'}`}>
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-500/10' : 'bg-surface-hover'}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary">{msg.content}</p>
                {msg.context && msg.role === 'assistant' && (
                  <div className="mt-3 border-t border-app pt-2">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Grounded in live database records</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-hero text-white"><Bot size={15} /></div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-surface-hover px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {error && <div className="flex items-center gap-2 rounded-xl bg-red-500/5 p-3 text-xs text-red-500"><AlertTriangle size={14} />{error}</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') ask(input); }}
          placeholder="Ask about orders, inventory, risk..."
          className="input-field flex-1 text-sm"
          disabled={loading}
        />
        <button onClick={() => ask(input)} disabled={loading || !input.trim()} className="btn-primary flex items-center gap-2 px-5">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
