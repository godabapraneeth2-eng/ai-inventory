import { motion } from 'framer-motion';
import { Cpu, ShieldCheck, FileText, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface ExplainabilityPanelProps {
  agentName: string;
  confidence: number;
  reasoning: string;
  policyReference?: string;
  evidence?: string[] | Record<string, any>;
  onClose?: () => void;
}

export function ExplainabilityPanel({
  agentName,
  confidence,
  reasoning,
  policyReference,
  evidence,
  onClose
}: ExplainabilityPanelProps) {
  const confidenceColor = confidence >= 0.95 
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
    : confidence >= 0.7 
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
    : 'text-red-500 bg-red-500/10 border-red-500/20';

  const confidenceTier = confidence >= 0.95
    ? 'Automated Execution (Tier 1)'
    : confidence >= 0.7
    ? 'Manager Review Required (Tier 2)'
    : 'Human Specialist Override (Tier 3)';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden border border-blue-500/20 p-5 shadow-xl shadow-blue-500/5"
    >
      <div className="flex items-center justify-between border-b border-app pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-primary">{agentName}</h3>
              <span className="font-mono text-[10px] text-muted">XAI Engine</span>
            </div>
            <p className="text-[11px] text-secondary">Decision audit & evidence transparency</p>
          </div>
        </div>
        <div className={`rounded-xl border px-3 py-1.5 text-right ${confidenceColor}`}>
          <div className="font-mono text-xs font-bold">{(confidence * 100).toFixed(0)}% Confidence</div>
          <div className="text-[9px] uppercase tracking-wider">{confidenceTier}</div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Decision Rationale</label>
          <p className="mt-1 rounded-xl bg-surface-hover/60 p-3 text-xs leading-relaxed text-primary">
            {reasoning}
          </p>
        </div>

        {policyReference && (
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Regulatory & Policy Source</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-app bg-surface p-2.5 text-xs text-secondary">
              <FileText size={14} className="text-blue-500 shrink-0" />
              <span className="truncate font-mono text-[11px] text-primary">{policyReference}</span>
            </div>
          </div>
        )}

        {evidence && (
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted">Extracted Signals & Features</label>
            <div className="mt-1.5 space-y-1.5">
              {Array.isArray(evidence) ? (
                evidence.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg bg-surface-hover/40 px-3 py-1.5 text-xs text-secondary">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                  </div>
                ))
              ) : (
                Object.entries(evidence).map(([key, val], idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-surface-hover/40 px-3 py-1.5 text-xs">
                    <span className="text-secondary capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-mono text-primary">{String(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {onClose && (
        <div className="mt-4 border-t border-app pt-3 text-right">
          <button onClick={onClose} className="btn-secondary text-xs py-1.5 px-3">
            Dismiss Details
          </button>
        </div>
      )}
    </motion.div>
  );
}
