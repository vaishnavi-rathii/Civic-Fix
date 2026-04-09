import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Trash2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { askClaude } from '../lib/claude';

const QUICK_REPLIES = [
  'How do I report an issue?',
  'Track my complaint',
  'Know your rights',
  'Contact municipality',
];

const SYSTEM_PROMPT = (issuesJson, userName) =>
  `You are CivicFix Assistant, an AI helper for Indian citizens navigating civic issues.
You help people report problems, understand their rights, track complaints, and interact with municipal authorities.
You know about Delhi's municipal structure (MCD, NDMC, DJB, PWD, Delhi Police), Indian RTI Act 2005, and civic complaint procedures.
Be warm, helpful, and speak in simple English. Keep responses concise (2-4 sentences max).
If asked about specific issues, use the context provided. Always encourage civic participation.
Current issues data: ${issuesJson}
Logged in user: ${userName || 'Guest'}`;

export default function AIChatbot() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const greeting = user
    ? `Hi ${user.name.split(' ')[0]}! 👋 How can I help you today? I can help you report issues, track complaints, or understand your civic rights.`
    : `Hi! 👋 I'm CivicFix Assistant. Ask me anything about reporting civic issues, your rights as a citizen, or how to contact municipal authorities.`;

  const initialMessages = [{ role: 'assistant', content: greeting }];

  const messages = history.length === 0 ? initialMessages : history;

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const getIssues = () => {
    try { return JSON.parse(localStorage.getItem('cf_issues') || '[]'); }
    catch { return []; }
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    const base = history.length === 0 ? initialMessages : history;
    const next = [...base, userMsg];
    setHistory(next);
    setLoading(true);

    try {
      const issues = getIssues();
      const issuesSummary = issues.slice(0, 30).map(i =>
        `[${i.status}] ${i.title} (${i.category}) @ ${i.location?.address || 'unknown'}`
      ).join('\n');

      const conversationHistory = next.slice(1).map(m => ({ role: m.role, content: m.content }));
      const lastUserMsg = conversationHistory.pop();

      const apiMessages = conversationHistory.length > 0
        ? [...conversationHistory, lastUserMsg]
        : [lastUserMsg];

      const issues2 = getIssues();
      const ctx = issues2.slice(0, 30).map(i =>
        `[${i.status}] ${i.title} (${i.category}) @ ${i.location?.address || 'unknown'}`
      ).join('\n') || 'No issues yet.';

      const reply = await askClaude(
        SYSTEM_PROMPT(ctx, user?.name),
        msg,
        300
      );
      setHistory(h => [...h, { role: 'assistant', content: reply }]);
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please check your API key and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setHistory([]);

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-black/5 animate-slide-up overflow-hidden"
          style={{ width: '380px', maxWidth: 'calc(100vw - 2rem)', maxHeight: '560px' }}
        >
          {/* Header */}
          <div className="bg-navy-900 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-flame-500 flex items-center justify-center shadow-lg shadow-flame-500/40">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm">CivicFix Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/50 font-body">Powered by Claude AI</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} title="Clear chat"
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <Trash2 size={13} className="text-white/50" />
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <ChevronDown size={15} className="text-white/60" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50" style={{ minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot size={13} className="text-flame-400" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-flame-500 text-white rounded-br-sm shadow-flame-500/20'
                    : 'bg-white text-gray-700 rounded-bl-sm border border-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-flame-400" />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex items-center gap-2 text-flame-400">
                    <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-flame-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs font-body ml-1">CivicFix AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies (on first open only) */}
          {history.length === 0 && (
            <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-navy-900/5 text-navy-900 border border-navy-900/10 font-display font-semibold hover:bg-navy-900/10 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask me anything about civic issues…"
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-body text-navy-900 placeholder:text-gray-400 focus:outline-none focus:border-flame-400 transition-colors bg-gray-50"
                style={{ maxHeight: '80px', overflowY: 'auto' }}
              />
              <button onClick={() => send()}
                disabled={!input.trim() || loading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                  ${input.trim() && !loading
                    ? 'bg-flame-500 text-white hover:bg-flame-600 hover:-translate-y-0.5 shadow-md shadow-flame-500/30'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-flame-500 text-white shadow-xl shadow-flame-500/40 flex items-center justify-center transition-all hover:bg-flame-600 hover:scale-110 active:scale-95"
        aria-label="Open CivicFix Assistant"
      >
        {open ? <X size={22} /> : (
          <div className="relative">
            <MessageCircle size={24} />
            <span className="absolute -top-1.5 -right-1.5 text-[10px]">✨</span>
          </div>
        )}
      </button>
    </>
  );
}
