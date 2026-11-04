import { Loader2, Zap } from 'lucide-react'
import { kindLabel, priceLabel, shortAddress, type Service } from '@/lib/meter'
import type { CallRecord } from '@/hooks/useMeter'

interface Props {
  services: Service[]
  loading: boolean
  calls: CallRecord[]
  canPay: boolean
  disabledReason: string | null
  onPay: (service: Service) => void
}

export function Catalog({ services, loading, calls, canPay, disabledReason, onPay }: Props) {
  const live = services.filter((s) => s.active)
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Pay-per-call services</h2>
        <span className="text-xs text-white/45">One cheap transaction per call.</span>
      </div>
      {loading ? (
        <p className="text-white/50">Loading services...</p>
      ) : live.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
          No services are listed yet. Open the Sell tab to list the first one.
        </p>
      ) : (
        <ul className="grid gap-3">
          {live.map((service) => {
            const paying = calls.some((c) => c.service.id === service.id && c.status === 'paying')
            return (
              <li
                key={service.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-semibold">{service.name}</h3>
                  <p className="mt-1 text-sm text-white/55">
                    {kindLabel(service.kind)} by <span className="font-mono text-white/70">{shortAddress(service.seller)}</span>
                  </p>
                </div>
                <button
                  disabled={!canPay || paying}
                  onClick={() => onPay(service)}
                  title={disabledReason ?? undefined}
                  className="flex h-11 min-w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-arc-300 px-4 font-display text-sm font-semibold tabular-nums text-ink-950 transition hover:bg-arc-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {paying ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                  {paying ? 'Paying' : priceLabel(service.price)}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {disabledReason && live.length > 0 && <p className="mt-3 text-sm text-white/45">{disabledReason}</p>}
    </section>
  )
}
