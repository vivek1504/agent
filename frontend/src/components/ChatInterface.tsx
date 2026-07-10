import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Copy, Check, Paperclip, Terminal, User, Bot, Code2 } from 'lucide-react';
import { queryService } from '@/services/api';
import { useToast } from '@/components/ui/toast';
import { cn, generateId } from '@/lib/utils';
import type { ChatMessage } from '@/types';

interface ChatInterfaceProps {
  playgroundId: number;
  playgroundName: string;
  onIngestClick?: () => void;
}

// ── Typing indicator ───────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Copy Button ────────────────────────────────────────────────────────
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className={cn(
        'rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150',
        className
      )}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── SQL Syntax Highlighter ─────────────────────────────────────────────
function highlightSQL(code: string): React.ReactNode {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    let highlighted = line;

    // Keywords
    highlighted = highlighted.replace(
      /\b(SELECT|FROM|JOIN|ON|WHERE|GROUP BY|ORDER BY|LIMIT|AS|AND|OR|IN|NOT|NULL|DESC|ASC|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|DISTINCT|HAVING|UNION|CASE|WHEN|THEN|ELSE|END|LEFT|RIGHT|INNER|OUTER|CROSS|IS|BETWEEN|LIKE|EXISTS|INTO|VALUES|SET|TABLE|INDEX|VIEW|WITH|RECURSIVE|OVER|PARTITION|ROW_NUMBER|RANK|DENSE_RANK|OFFSET|FETCH|RETURNING)\b/gi,
      '<kw>$1</kw>'
    );

    // Functions
    highlighted = highlighted.replace(
      /\b(SUM|COUNT|AVG|MAX|MIN|COALESCE|DATE_TRUNC|NOW|CURRENT_DATE|CURRENT_TIMESTAMP|EXTRACT|CAST|CONCAT|SUBSTRING|LENGTH|UPPER|LOWER|TRIM|ROUND|ABS|NULLIF|ARRAY_AGG|STRING_AGG|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|FIRST_VALUE|LAST_VALUE)\s*(?=\()/gi,
      '<fn>$1</fn>'
    );

    // Strings
    highlighted = highlighted.replace(
      /('(?:[^'\\]|\\.)*')/g,
      '<str>$1</str>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+(?:\.\d+)?)\b/g,
      '<num>$1</num>'
    );

    // Comments
    highlighted = highlighted.replace(
      /(--.*$)/g,
      '<cmt>$1</cmt>'
    );

    // Convert tags to JSX-friendly format
    const parts = highlighted.split(/(<\/?(?:kw|fn|str|num|cmt)>)/);
    let currentClass = '';

    const rendered = parts.map((part, j) => {
      if (part === '<kw>') { currentClass = 'sql-keyword'; return null; }
      if (part === '<fn>') { currentClass = 'sql-function'; return null; }
      if (part === '<str>') { currentClass = 'sql-string'; return null; }
      if (part === '<num>') { currentClass = 'sql-number'; return null; }
      if (part === '<cmt>') { currentClass = 'sql-comment'; return null; }
      if (part.startsWith('</')) { currentClass = ''; return null; }

      if (currentClass) {
        return <span key={j} className={currentClass}>{part}</span>;
      }
      return part;
    });

    return (
      <span key={i}>
        {rendered}
        {i < lines.length - 1 && '\n'}
      </span>
    );
  });
}

// ── Code Block Component ───────────────────────────────────────────────
function CodeBlock({ code, language = 'sql' }: { code: string; language?: string }) {
  return (
    <div className="group/code relative rounded-lg border border-border overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {language}
          </span>
        </div>
        <CopyButton
          text={code}
          className="opacity-0 group-hover/code:opacity-100"
        />
      </div>
      {/* Code */}
      <pre className="p-4 text-[13px] leading-relaxed font-mono overflow-x-auto bg-card">
        <code>{language === 'sql' ? highlightSQL(code) : code}</code>
      </pre>
    </div>
  );
}

// ── Message Content Parser ─────────────────────────────────────────────
function MessageContent({ content, role }: { content: string; role: 'user' | 'assistant' }) {
  if (role === 'user') {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  // Parse code blocks from assistant messages
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push(
          <p key={`text-${lastIndex}`} className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {textBefore.trim()}
          </p>
        );
      }
    }

    // Code block
    const lang = match[1] || 'sql';
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={lang} />);
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  const remaining = content.slice(lastIndex);
  if (remaining.trim()) {
    // Check if the remaining content looks like SQL (heuristic)
    const looksLikeSQL = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(remaining) &&
      remaining.split('\n').length > 1;

    if (looksLikeSQL && parts.length === 0) {
      // Try to split into text and SQL parts
      const sqlStart = remaining.search(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
      const textBefore = remaining.slice(0, sqlStart).trim();
      const sqlContent = remaining.slice(sqlStart).trim();

      if (textBefore) {
        parts.push(
          <p key="remaining-text" className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {textBefore}
          </p>
        );
      }
      parts.push(<CodeBlock key="remaining-sql" code={sqlContent} language="sql" />);
    } else {
      parts.push(
        <p key="remaining" className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {remaining.trim()}
        </p>
      );
    }
  }

  return <div className="space-y-3">{parts.length > 0 ? parts : <p className="text-sm text-muted-foreground">{content}</p>}</div>;
}

// ── Example Questions ──────────────────────────────────────────────────
const EXAMPLE_QUESTIONS = [
  'What tables are in this database?',
  'Show me the top 10 rows from the largest table',
  'How many records are there in total?',
  'What are the column names and types?',
];

// ── Main Component ─────────────────────────────────────────────────────
export default function ChatInterface({ playgroundId, playgroundName, onIngestClick }: ChatInterfaceProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '56px';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim()) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date(),
    };
    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setIsQuerying(true);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = '56px';
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await queryService.ask({ question: question.trim(), playground_id: playgroundId });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: res.answer, isLoading: false }
            : m
        )
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Query failed';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: `Error: ${errMsg}`, isLoading: false }
            : m
        )
      );
      toast(errMsg, 'error');
    } finally {
      setIsQuerying(false);
    }
  }, [playgroundId, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isQuerying) sendMessage(value);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Messages Area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Welcome State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-4"
          >
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                <Terminal className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h2 className="font-semibold text-xl tracking-tight">{playgroundName}</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Ask anything about your database in natural language
              </p>
            </div>

            {/* Example Question Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-accent transition-all duration-150"
                  id={`example-q-${q.slice(0, 10).replace(/\s/g, '-')}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message Thread */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group"
              >
                <div className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}>
                  {/* Avatar for Assistant */}
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={cn(
                    'relative max-w-[85%] min-w-0',
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3'
                      : 'flex-1'
                  )}>
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-1">
                        <span className="text-sm">Querying database</span>
                        <TypingDots />
                      </div>
                    ) : (
                      <>
                        <MessageContent content={msg.content} role={msg.role} />
                        {/* Copy button for assistant messages */}
                        {msg.role === 'assistant' && (
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={msg.content} />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Avatar for User */}
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Area ──────────────────────────────────────────────── */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-card shadow-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all duration-150">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); adjustHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${playgroundName}...`}
              className={cn(
                'w-full bg-transparent px-4 pt-3.5 pb-2 text-sm resize-none rounded-t-xl',
                'placeholder:text-muted-foreground/50',
                'focus:outline-none',
                'min-h-[56px]'
              )}
              style={{ overflow: 'hidden' }}
              disabled={isQuerying}
              id="chat-input"
            />

            <div className="px-3 pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                {onIngestClick && (
                  <button
                    type="button"
                    onClick={onIngestClick}
                    className="flex items-center gap-1.5 rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs"
                    title="Upload documents"
                    id="ingest-docs-trigger"
                  >
                    <Paperclip className="h-4 w-4" strokeWidth={1.5} />
                    <span className="hidden sm:inline text-xs">Attach</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground/50 hidden sm:block">
                  {isQuerying ? 'Running query...' : '⏎ to send · ⇧⏎ new line'}
                </span>
                <button
                  type="button"
                  onClick={() => value.trim() && !isQuerying && sendMessage(value)}
                  disabled={isQuerying || !value.trim()}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all duration-150',
                    value.trim() && !isQuerying
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                  id="send-button"
                >
                  {isQuerying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {isQuerying ? 'Running' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
