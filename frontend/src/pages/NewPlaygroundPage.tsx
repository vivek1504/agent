import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, ArrowLeft, AlertTriangle, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Separator } from '@/components/ui/primitives';
import { RadioGroup, RadioGroupItem } from '@/components/ui/select-radio';
import { cn } from '@/lib/utils';
import { playgroundService } from '@/services/api';
import { useToast } from '@/components/ui/toast';

const DB_PRESETS = [
  {
    id: 'postgres',
    label: 'PostgreSQL',
    placeholder: 'postgresql://user:pass@host:5432/dbname',
    desc: 'Best for production workloads',
    features: ['Full SQL support', 'JSON columns', 'Window functions', 'CTEs'],
  },
  {
    id: 'mysql',
    label: 'MySQL / MariaDB',
    placeholder: 'mysql://user:pass@host:3306/dbname',
    desc: 'Great for web applications',
    features: ['Wide hosting support', 'Fast reads', 'Full-text search', 'Stored procedures'],
  },
  {
    id: 'sqlite',
    label: 'SQLite',
    placeholder: 'sqlite:///path/to/database.db',
    desc: 'Perfect for local development',
    features: ['Zero config', 'File-based', 'No server needed', 'Lightweight'],
  },
];

export default function NewPlaygroundPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [dbUrl, setDbUrl] = useState('');
  const [context, setContext] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(DB_PRESETS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = DB_PRESETS.find((p) => p.id === selectedPreset) ?? DB_PRESETS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dbUrl.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const pg = await playgroundService.create({ name, db_url: dbUrl, context });
      toast(`Playground "${pg.name}" created!`, 'success');
      navigate(`/playground/${pg.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playground');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-100 mb-10"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Back
      </button>

      <h1 className="text-3xl font-black tracking-tight mb-2">New Playground</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Connect a database to start asking questions in plain English.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left: form */}
          <div className="lg:col-span-7 space-y-8">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Playground name</Label>
              <Input
                id="name"
                placeholder="e.g. Production Analytics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* DB type */}
            <div className="space-y-3">
              <Label>Database type</Label>
              <RadioGroup value={selectedPreset} onValueChange={setSelectedPreset} className="space-y-3">
                {DB_PRESETS.map((preset) => (
                  <label
                    key={preset.id}
                    htmlFor={preset.id}
                    className={cn(
                      'relative block cursor-pointer border transition-colors duration-100',
                      selectedPreset === preset.id
                        ? 'border-foreground'
                        : 'border-border hover:border-muted-foreground/40'
                    )}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className="mt-0.5">
                        <RadioGroupItem value={preset.id} id={preset.id} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{preset.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{preset.desc}</p>
                        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          {preset.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-foreground" strokeWidth={2} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Connection URL */}
            <div className="space-y-2">
              <Label htmlFor="db-url">Connection URL</Label>
              <Input
                id="db-url"
                placeholder={preset.placeholder}
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                required
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Your credentials are never stored in plaintext.
              </p>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <Label htmlFor="context">Business context <span className="text-muted-foreground/50">(optional)</span></Label>
              <Textarea
                id="context"
                placeholder="Describe your database, domain terms, and any business logic the AI should know..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This helps the AI understand domain-specific terminology.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 p-4 border border-foreground text-foreground text-sm"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <Separator />

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !name.trim() || !dbUrl.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Create Playground
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right: tips */}
          <div className="lg:col-span-5">
            <div className="border border-border bg-muted/30 sticky top-20 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                <h4 className="font-semibold text-sm">Connection tips</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Make sure your database is accessible from the server. For local databases,
                use a tunnel or ngrok.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Use a read-only user for safety',
                  'Ensure the host is reachable from the server',
                  'Test your URL before connecting',
                  'Add context to improve AI answers',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-foreground mt-0.5 shrink-0" strokeWidth={2} />
                    {tip}
                  </li>
                ))}
              </ul>
              <a
                href="https://docs.sqlalchemy.org/en/20/core/engines.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-foreground hover:underline underline-offset-4"
              >
                SQLAlchemy URL format docs
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
