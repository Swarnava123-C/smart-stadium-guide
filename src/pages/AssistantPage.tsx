import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MapPin, Calendar } from 'lucide-react';
import { useStadiums, useStadiumDetail } from '@/hooks/useStadiums';
import { ChatMessage } from '@/types/stadium';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stadium-chat`;

export const AIAssistantPage: React.FC = () => {
  const { stadiums } = useStadiums();
  const [selectedStadiumId, setSelectedStadiumId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { events } = useStadiumDetail(selectedStadiumId || undefined);

  const selectedStadium = stadiums.find(s => s.id === selectedStadiumId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Welcome to **ArenaFlow AI**! I'm your smart stadium assistant.\n\nAsk me about the best entry gates, shortest food queues, nearest washrooms, or anything about your venue experience.\n\n**Select a stadium and event above** to get personalized, data-driven recommendations — or just ask and I'll help you choose!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Reset event when stadium changes
  useEffect(() => {
    setSelectedEventId(null);
  }, [selectedStadiumId]);

  const quickQuestions = [
    "Which gate has the shortest wait?",
    "Where's the nearest washroom?",
    "Best food stall right now?",
    "What's the crowd status?",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatMessages = messages
        .filter(m => m.id !== '1')
        .map(m => ({ role: m.role, content: m.content }));
      chatMessages.push({ role: 'user', content: text.trim() });

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: chatMessages,
          selectedStadiumId,
          selectedEventId,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(
          resp.status === 429 ? 'Rate limited. Please wait a moment.' :
          resp.status === 402 ? 'AI credits exhausted. Please add funds in Settings → Workspace → Usage.' :
          errData.error || 'Failed to get response'
        );
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      const assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ ${err instanceof Error ? err.message : 'Something went wrong. Please try again.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-3xl mx-auto">
      <div className="mb-3">
        <h2 className="text-2xl font-display font-bold">
          <span className="gradient-text">AI Assistant</span>
        </h2>
        <p className="text-sm text-muted-foreground">Get real-time venue guidance powered by AI</p>
      </div>

      {/* Stadium & Event Selectors */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedStadiumId || ''}
            onChange={e => setSelectedStadiumId(e.target.value || null)}
            className="flex-1 h-9 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Select stadium"
          >
            <option value="">Select a stadium...</option>
            {stadiums.map(s => (
              <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedEventId || ''}
            onChange={e => setSelectedEventId(e.target.value || null)}
            className="flex-1 h-9 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            disabled={!selectedStadiumId}
            aria-label="Select event"
          >
            <option value="">Select an event...</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>
                {e.event_name} — {new Date(e.event_date).toLocaleDateString()} ({e.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Context Chips */}
      {(selectedStadium || selectedEvent) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedStadium && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
              <MapPin className="w-3 h-3" /> {selectedStadium.name}
            </span>
          )}
          {selectedEvent && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border",
              selectedEvent.status === 'live' ? 'bg-secondary/10 text-secondary border-secondary/20' :
              selectedEvent.status === 'completed' ? 'bg-muted text-muted-foreground border-border/30' :
              'bg-primary/10 text-primary border-primary/20'
            )}>
              <Calendar className="w-3 h-3" />
              {selectedEvent.event_name} ({selectedEvent.status})
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4" role="log" aria-label="Chat messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 animate-fade-in',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary/20 border border-primary/30 text-foreground'
                  : 'glass'
              )}
            >
              <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-foreground [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <time className="text-[10px] text-muted-foreground mt-1 block">
                {msg.timestamp.toLocaleTimeString()}
              </time>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="glass rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 rounded-full text-xs font-medium glass border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input); }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={selectedStadium ? `Ask about ${selectedStadium.name}...` : "Ask about gates, food, washrooms, navigation..."}
          className="flex-1 h-11 rounded-xl bg-muted/50 border border-border/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          disabled={isLoading}
          aria-label="Message input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
