import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, MessageSquare, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/TetrisLoading';
import ChatInterface from '@/components/ChatInterface';
import IngestPanel from '@/components/IngestPanel';
import { playgroundService } from '@/services/api';
import type { PlaygroundDetail } from '@/types';

export default function PlaygroundPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playground, setPlayground] = useState<PlaygroundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIngest, setShowIngest] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    playgroundService
      .get(Number(id))
      .then(setPlayground)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner text="Connecting to database..." />
      </div>
    );
  }

  if (error || !playground) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="font-semibold text-base mb-1">Connection Error</h2>
          <p className="text-sm text-muted-foreground">{error ?? 'Playground not found'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')} id="back-to-dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* ── Sub-header bar ──────────────────────────────────────────── */}
      <div className="border-b border-border px-4 sm:px-6 py-2.5 flex items-center justify-between bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            id="playground-back-button"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2.5">
            <h2 className="font-medium text-sm">{playground.name}</h2>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">SQL Agent</span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            Live
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setShowIngest((v) => !v)}
            id="toggle-ingest-button"
          >
            {showIngest ? (
              <>
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                Chat
              </>
            ) : (
              <>
                <FileUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                Ingest Docs
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <motion.div
          className="flex-1 overflow-hidden"
          animate={{ width: showIngest ? '60%' : '100%' }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <ChatInterface
            playgroundId={playground.id}
            playgroundName={playground.name}
            onIngestClick={() => setShowIngest(true)}
          />
        </motion.div>

        {/* Ingest Side Panel */}
        <AnimatePresence>
          {showIngest && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '40%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="border-l border-border bg-background overflow-hidden"
            >
              <IngestPanel
                playgroundId={playground.id}
                initialContext={playground.context}
                onClose={() => setShowIngest(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
