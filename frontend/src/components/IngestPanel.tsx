import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/primitives';
import { ingestService } from '@/services/api';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface IngestPanelProps {
  playgroundId: number;
  initialContext?: string;
  onClose?: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IngestPanel({ playgroundId, initialContext = '', onClose }: IngestPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState(initialContext);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = Array.from(incoming).filter((f) =>
      f.name.endsWith('.pdf') || f.name.endsWith('.txt') || f.name.endsWith('.md')
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...allowed.filter((f) => !existing.has(f.name))];
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length && !context.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await ingestService.ingest(playgroundId, context, files);
      setSuccess(true);
      toast(`Ingested ${result.ingested} document${result.ingested !== 1 ? 's' : ''}`, 'success');
      if (result.ingested > 0) setFiles([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ingest failed';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.15 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Ingest Documents</h2>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors duration-100">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Drop zone — minimalist dashed border */}
        <div>
          <Label className="mb-2 block">Documents (PDF, TXT, MD)</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 cursor-pointer transition-colors duration-100',
              dragging
                ? 'border-foreground bg-muted/50'
                : 'border-border hover:border-muted-foreground'
            )}
          >
            <Upload className={cn('h-5 w-5 transition-colors duration-100', dragging ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Drag & drop or{' '}
                <span className="text-foreground underline underline-offset-4">browse files</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                PDF, TXT, MD — max 10 MB each
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>

        {/* File list — bracketed tags */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              {files.map((file, i) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: i * 0.03 }}
                  className="flex items-center gap-2 border border-border px-3 py-1.5 text-xs group"
                >
                  <span className="text-muted-foreground font-mono">[</span>
                  <span className="font-mono truncate max-w-[120px]">{file.name}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">{formatBytes(file.size)}</span>
                  <span className="text-muted-foreground font-mono">]</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-100 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context text */}
        <div className="space-y-2">
          <Label htmlFor="context-text">Business context</Label>
          <Textarea
            id="context-text"
            placeholder="Describe domain terms, column meanings, or business rules..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            className="text-xs"
          />
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 text-xs p-3 border border-foreground text-foreground"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 text-xs p-3 border border-border text-foreground"
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              Documents ingested successfully
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          {onClose && (
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={loading || (!files.length && !context.trim())}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Ingesting...</>
            ) : (
              <><Upload className="h-4 w-4" />Ingest</>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
