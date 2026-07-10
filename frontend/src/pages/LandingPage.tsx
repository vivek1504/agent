import { motion } from 'framer-motion';
import { Github, Database, Zap, FileText, ArrowRight, Terminal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Database,
    title: 'Connect Any Database',
    desc: 'PostgreSQL, MySQL, SQLite — just paste your connection URL and start querying instantly.',
  },
  {
    icon: Zap,
    title: 'Natural Language SQL',
    desc: 'No SQL expertise needed. Ask questions like you would talk to a colleague.',
  },
  {
    icon: FileText,
    title: 'Context-Aware',
    desc: 'Upload PDFs, docs, and business context to improve the AI\'s understanding of your domain.',
  },
];

const terminalLines = [
  { type: 'prompt', content: '~ sqlwizard' },
  { type: 'input', content: '"Show me top 10 customers by revenue this quarter"' },
  { type: 'output', content: '› Analyzing schema: customers, orders, products...' },
  { type: 'output', content: '› Generating optimized SQL query...' },
  { type: 'sql', content: `SELECT c.name, SUM(o.amount) AS revenue
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= DATE_TRUNC('quarter', NOW())
GROUP BY c.name
ORDER BY revenue DESC
LIMIT 10;` },
  { type: 'success', content: '✓ 10 results returned in 0.24s' },
];

function TerminalWindow() {
  return (
    <div className="terminal-glow rounded-xl overflow-hidden bg-card">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-3 w-3 rounded-full bg-green-400/80" />
          </div>
          <div className="h-3.5 w-px bg-border ml-1" />
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <Terminal className="h-3 w-3" />
            sqlwizard
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            Connected
          </span>
        </div>
      </div>

      {/* Terminal content */}
      <div className="p-5 font-mono text-[13px] leading-relaxed space-y-1.5 bg-card">
        {terminalLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12, duration: 0.3, ease: 'easeOut' }}
          >
            {line.type === 'prompt' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-success font-semibold">$</span>
                <span>{line.content}</span>
              </div>
            )}
            {line.type === 'input' && (
              <div className="pl-4 text-foreground">{line.content}</div>
            )}
            {line.type === 'output' && (
              <div className="text-muted-foreground text-xs pl-4">{line.content}</div>
            )}
            {line.type === 'sql' && (
              <div className="my-2 ml-4 rounded-lg bg-muted/50 border border-border p-4 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">SQL</span>
                </div>
                <pre className="text-foreground/90 whitespace-pre-wrap">
                  {line.content.split('\n').map((sqlLine, j) => (
                    <span key={j}>
                      {highlightSQL(sqlLine)}
                      {j < line.content.split('\n').length - 1 && '\n'}
                    </span>
                  ))}
                </pre>
              </div>
            )}
            {line.type === 'success' && (
              <div className="text-success text-xs pl-4 font-medium pt-1">{line.content}</div>
            )}
          </motion.div>
        ))}

        {/* Blinking cursor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex items-center gap-2 text-muted-foreground pt-1"
        >
          <span className="text-success font-semibold">$</span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'steps(2)' }}
            className="inline-block w-2 h-4 bg-foreground/70"
          />
        </motion.div>
      </div>
    </div>
  );
}

function highlightSQL(line: string): React.ReactNode {
  const keywords = /\b(SELECT|FROM|JOIN|ON|WHERE|GROUP BY|ORDER BY|LIMIT|AS|AND|OR|IN|NOT|NULL|DESC|ASC|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|DISTINCT|HAVING|UNION|CASE|WHEN|THEN|ELSE|END|DATE_TRUNC|NOW|SUM|COUNT|AVG|MAX|MIN)\b/gi;
  const parts = line.split(keywords);

  return parts.map((part, i) => {
    if (keywords.test(part)) {
      return <span key={i} className="sql-keyword">{part}</span>;
    }
    // Highlight strings
    const stringMatch = part.match(/('.*?')/g);
    if (stringMatch) {
      let result = part;
      stringMatch.forEach((s) => {
        result = result.replace(s, `§STRING§${s}§END§`);
      });
      return result.split('§').map((segment, j) => {
        if (segment.startsWith('STRING§')) {
          return <span key={`${i}-${j}`} className="sql-string">{segment.replace('STRING§', '')}</span>;
        }
        if (segment === 'END') return null;
        return segment;
      });
    }
    // Highlight numbers
    const withNumbers = part.replace(/\b(\d+)\b/g, '§NUM§$1§END§');
    if (withNumbers !== part) {
      return withNumbers.split('§').map((segment, j) => {
        if (segment.startsWith('NUM§')) {
          return <span key={`${i}-${j}`} className="sql-number">{segment.replace('NUM§', '')}</span>;
        }
        if (segment === 'END') return null;
        return segment;
      });
    }
    return part;
  });
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
                <Database className="h-3.5 w-3.5 text-background" strokeWidth={2} />
              </div>
              <span className="font-semibold text-sm tracking-tight">SQLWizard</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => (window.location.href = authService.getLoginUrl())}
                id="landing-signin-button"
              >
                Sign in
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-28 overflow-hidden">
        {/* Dot pattern background */}
        <div className="absolute inset-0 dot-pattern opacity-60" />
        {/* Radial fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              AI-Powered SQL Agent
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-foreground">
              Talk to your
              <br />
              <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                database.
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Connect any SQL database and ask questions in plain English.
            <br className="hidden sm:block" />
            No SQL expertise required — SQLWizard handles the rest.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="gap-2.5 text-sm px-6 shadow-lg"
              onClick={() => (window.location.href = authService.getLoginUrl())}
              id="landing-github-button"
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-sm px-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              id="landing-learn-more-button"
            >
              Learn more
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>

          {/* Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-12 sm:mt-16 text-left max-w-2xl mx-auto"
          >
            <TerminalWindow />
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-border px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Everything you need
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-md mx-auto">
              A powerful toolkit for querying databases without writing SQL.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-foreground/20 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted mb-4 group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-sm mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SQLWizard
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Github className="h-3 w-3" />
            Open Source
          </span>
        </div>
      </footer>
    </div>
  );
}
