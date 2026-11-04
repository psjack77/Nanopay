import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { Loader2, Plus } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { formatUsdc, parseUsdc } from '@/onchain-money'
import { KINDS, kindLabel, priceLabel, shortAddress, trimUsdc } from '@/lib/meter'
import type { Meter } from '@/hooks/useMeter'

const cta =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-arc-300 px-4 font-display text-sm font-semibold text-ink-950 transition hover:bg-arc-400 disabled:cursor-not-allowed disabled:opacity-50'
const field = 'h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm outline-none focus:border-arc-300/60'

function ListService({ meter }: { meter: Meter }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState(0)
  const [price, setPrice] = useState('0.001')
  const busy = meter.step !== 'idle'
  let raw = 0n
  try {
    raw = parseUsdc(price)
  } catch {
    raw = 0n
  }
  const valid = name.trim().length > 0 && name.length <= 48 && raw > 0n

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">List a service</h2>
      <p className="mt-1 text-sm text-white/55">You earn the price every time someone pays. No admin can touch your earnings.</p>
      <div className="mt-4 grid gap-3">
        <input className={field} placeholder="Service name" maxLength={48} value={name} onChange={(e) => setName(e.target.value)} />
        <select className={field} value={kind} onChange={(e) => setKind(Number(e.target.value))}>
          {KINDS.map((k) => (
            <option key={k.id} value={k.id} className="bg-ink-900">
              {k.label}
            </option>
          ))}
        </select>
        <p className="-mt-1 text-xs text-white/45">{KINDS[kind].blurb}</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
          <input
            inputMode="decimal"
            className="h-12 w-full bg-transparent text-sm tabular-nums outline-none"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            aria-label="Price in USDC"
          />
          <span className="text-sm text-white/50">USDC per call</span>
        </div>
        <button
          className={cta}
          disabled={!valid || busy}
          onClick={() => void meter.createService(kind, raw, name.trim())}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {busy ? 'Confirming...' : 'List service'}
        </button>
        {meter.txError && <p className="text-sm text-red-300">{meter.txError}</p>}
      </div>
    </section>
  )
}

export function SellerView({ meter }: { meter: Meter }) {
  if (!meter.isConnected) {
    return (
      <section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">Sell by the call</h2>
        <p className="mt-2 text-sm text-white/55">Connect the wallet that should earn from your services.</p>
        <ConnectKitButton.Custom>
          {({ show }) => (
            <button onClick={show} className={`${cta} mt-5`}>
              Connect wallet
            </button>
          )}
        </ConnectKitButton.Custom>
      </section>
    )
  }

  const mine = meter.services.filter((s) => s.seller.toLowerCase() === meter.address?.toLowerCase())
  const busy = meter.step !== 'idle'

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="grid h-fit gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">Your earnings</p>
          <div className="mt-2 flex items-center gap-3">
            <TokenUSDC variant="branded" size={32} />
            <span className="font-display text-5xl font-semibold tabular-nums tracking-[-0.03em]">
              {trimUsdc(meter.earnings ?? '0')}
            </span>
          </div>
          <button
            className={`${cta} mt-5`}
            disabled={meter.earningsRaw === 0n || busy}
            onClick={() => void meter.withdrawEarnings()}
          >
            Withdraw earnings
          </button>
        </section>
        <ListService meter={meter} />
      </div>

      <div className="grid h-fit gap-8">
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold tracking-[-0.02em]">Your services</h2>
          {mine.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
              Nothing listed yet. Add your first service.
            </p>
          ) : (
            <ul className="grid gap-2">
              {mine.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold">{s.name}</p>
                    <p className="text-xs text-white/50">
                      {kindLabel(s.kind)} · {priceLabel(s.price)} per call
                    </p>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => void meter.setActive(s.id, !s.active)}
                    className="h-9 rounded-lg border border-white/10 px-3 text-xs text-white/75 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    {s.active ? 'Pause' : 'Resume'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold tracking-[-0.02em]">Recent payments</h2>
          {meter.payments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
              No payments in the recent blocks yet.
            </p>
          ) : (
            <ul className="grid gap-2">
              {meter.payments.map((p) => (
                <li
                  key={`${p.transactionHash}-${p.logIndex}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"
                >
                  <span className="font-mono tabular-nums text-emerald-300">+{formatUsdc(p.args.price)}</span>
                  <span className="text-white/50">service #{p.args.id.toString()}</span>
                  <span className="ml-auto font-mono text-xs text-white/50">{shortAddress(p.args.buyer)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
