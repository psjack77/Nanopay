import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ARC_CHAIN_ID, priceLabel, resultFor } from '@/lib/meter'
import type { CallRecord } from '@/hooks/useMeter'

export function Receipts({ calls }: { calls: CallRecord[] }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-semibold tracking-[-0.02em]">Receipts</h2>
      {calls.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
          Results appear here after each paid call.
        </p>
      ) : (
        <ul className="grid gap-3">
          {calls.map((call) => (
            <li key={call.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm">
                {call.status === 'paying' && <Loader2 className="size-4 animate-spin text-arc-300" />}
                {call.status === 'success' && <CheckCircle2 className="size-4 text-emerald-400" />}
                {call.status === 'error' && <AlertCircle className="size-4 text-red-400" />}
                <span className="font-display font-semibold">{call.service.name}</span>
                <span className="tabular-nums text-white/50">{priceLabel(call.service.price)}</span>
                {call.result && (
                  <a
                    href={buildTxExplorerUrl(ARC_CHAIN_ID, call.result.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs text-arc-300 hover:underline"
                  >
                    Tx <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              {call.result && (
                <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-ink-950/70 p-3 font-mono text-xs leading-relaxed text-white/75">
                  {JSON.stringify(resultFor(call.service.kind, call.result), null, 2)}
                </pre>
              )}
              {call.status === 'error' && <p className="mt-2 text-sm text-red-300">{call.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
