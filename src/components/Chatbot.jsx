import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';
import { chatWithBot } from '../utils/claude';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm CivicBot 👋 Ask me anything — how to report issues, status of problems in your area, or how CivicFix works.",
    },
  ]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const getIssues = () => {
    try { return JSON.parse(localStorage.getItem('cf_issues') || '[]'); }
    catch { return []; }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const nextHistory = [...history, userMsg];
    setHistory(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const reply = await chatWithBot(text, getIssues(), history);
      setHistory(h => [...h, { role: 'assistant', content: reply }]);
    } catch (err) {
      setHistory(h => [...h, {
        role: 'assistant',
        content: "Sorry, I couldn't reach the AI right now. Please check your API key or try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const SUGGESTED = [
    'How do I report a pothole?',
    'What are drainage issues nearby?',
    'How long does resolution take?',
  ];

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] flex flex-col bg-white rounded-2xl shadow-2xl border border-black/5 animate-slide-up"
          style={{ maxHeight: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-navy-900 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-flame-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm">CivicBot</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/60 font-body">Powered by Claude</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronDown size={16} className="text-white/70" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0, maxHeight: '320px' }}>
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-flame-500/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot size={12} className="text-flame-500" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-flame-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-flame-500/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-flame-500" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts (only if first message shown) */}
          {history.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-flame-500/8 text-flame-600 border border-flame-500/20 font-display font-semibold hover:bg-flame-500/15 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask me anything…"
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-body text-navy-900 placeholder:text-gray-400 focus:outline-none focus:border-flame-400 transition-colors"
                style={{ maxHeight: '80px', overflowY: 'auto' }}
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                  ${input.trim() && !loading
                    ? 'bg-flame-500 text-white hover:bg-flame-600 hover:-translate-y-0.5 shadow-md shadow-flame-500/30'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bubble trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-flame-500 text-white shadow-xl shadow-flame-500/40 flex items-center justify-center transition-all hover:bg-flame-600 hover:scale-110 active:scale-95"
        aria-label="Open CivicBot"
      >
        {open
          ? <X size={22} />
          : (
            <div className="relative">
              <MessageCircle size={24} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
          )}
      </button>
    </>
  );
}
