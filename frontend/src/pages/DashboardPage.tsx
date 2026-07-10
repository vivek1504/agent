import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, Trash2, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/primitives';
import { usePlaygrounds } from '@/hooks/usePlaygrounds';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="pt-4 border-t border-border">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { playgrounds, loading, error, remove } = usePlaygrounds();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(id);
    try {
      await remove(id);
      toast('Playground deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Playgrounds</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? 'Loading your databases...'
              : `${playgrounds.length} database${playgrounds.length !== 1 ? 's' : ''} connected`}
          </p>
        </div>
        <Button asChild size="sm" className="gap-2" id="new-playground-button">
          <Link to="/new">
            <Plus className="h-3.5 w-3.5" />
            New Playground
          </Link>
        </Button>
      </div>

      {/* ── Error State ─────────────────────────────────────────────── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-foreground mb-6"
        >
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Loading Skeleton ────────────────────────────────────────── */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {!loading && !error && playgrounds.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-6">
            <Database className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-base mb-1">No playgrounds yet</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Connect a SQL database to start asking questions in plain English.
          </p>
          <Button asChild className="gap-2" id="create-first-playground-button">
            <Link to="/new">
              <Plus className="h-4 w-4" />
              Create your first playground
            </Link>
          </Button>
        </motion.div>
      )}

      {/* ── Playground Cards Grid ───────────────────────────────────── */}
      {!loading && playgrounds.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {playgrounds.map((pg, i) => (
              <motion.div
                key={pg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                layout
                onClick={() => navigate(`/playground/${pg.id}`)}
                className="group relative cursor-pointer rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/[0.03]"
                id={`playground-card-${pg.id}`}
              >
                {/* Card Content */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Database className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{pg.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDate(pg.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, pg.id)}
                    disabled={deletingId === pg.id}
                    className="rounded-md p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
                    id={`delete-playground-${pg.id}`}
                  >
                    {deletingId === pg.id ? (
                      <motion.div
                        className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-success pulse-dot" />
                    Connected
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 -translate-x-1">
                    Open
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
