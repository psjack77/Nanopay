import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { ArrowDownToLine, ExternalLink, Loader2 } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ARC_CHAIN_ID, trimUsdc } from '@/lib/meter'
import type { Meter } from '@/hooks/useMeter'

const CHIPS = ['0.10', '1', '5']
const STEP_LABEL = {
  idle: '',
  approving: 'Approve USDC in wallet...',
  depositing: 'Confirm deposit in wallet...',
  confirming: 'Waiting for confirmation...',
} as const

const cta =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-arc-300 px-4 font-display text-sm font-semibold text-ink-950 transition hover:bg-arc-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'

export function BalanceCard({ meter }: { meter: Meter }) {
  const [amount, setAmount] = useState('1')
  const busy = meter.step !== 'idle'
  const walletNum = Number(meter.walletUsdc ?? 0)
  const tooMuch = Number(amount) > walletNum
  const invalid = !(Number(amount) > 0) || tooMuch

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">Your credits</p>
      <div className="mt-2 flex items-center gap-3">
        <TokenUSDC variant="branded" size={32} />
        <span className="font-display text-5xl font-semibold tabular-nums tracking-[-0.03em]">
          {meter.credits !== null ? trimUsdc(meter.credits) : '0.00'}
        </span>
      </div>
      <p className="mt-2 text-pretty text-sm text-white/55">
        Prepaid USDC held in the contract. Wallet USDC:{' '}
        <span className="tabular-nums text-white/80">{meter.walletUsdc !== null ? trimUsdc(meter.walletUsdc) : '--'}</span>
      </p>

      <div className="mt-6 rounded-2xl bg-ink-950/60 p-4">
        {!meter.isConnected ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button className={cta} onClick={show}>
                Connect wallet to deposit
              </button>
            )}
          </ConnectKitButton.Custom>
        ) : meter.isWrongChain ? (
          <button className={cta} onClick={() => void meter.switchToArc()}>
            Switch to Arc Testnet
          </button>
        ) : (
          <>
            <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50" htmlFor="amount">
              Add credits
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
              <input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="h-12 w-full bg-transparent font-display text-xl tabular-nums outline-none"
                placeholder="0.00"
              />
              <span className="text-sm text-white/50">USDC</span>
            </div>
            <div className="mt-2 flex gap-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setAmount(chip)}
                  className="h-9 flex-1 rounded-lg border border-white/10 text-xs tabular-nums text-white/70 transition hover:bg-white/5"
                >
                  {chip}
                </button>
              ))}
            </div>
            <button className={`${cta} mt-4`} disabled={busy || invalid} onClick={() => void meter.deposit(amount)}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
              {busy ? STEP_LABEL[meter.step] : tooMuch && Number(amount) > 0 ? 'Insufficient wallet USDC' : 'Deposit'}
            </button>
            {meter.creditsRaw > 0n && (
              <button
                onClick={() => void meter.withdrawCredits(meter.creditsRaw)}
                disabled={busy}
                className="mt-2 h-10 w-full rounded-xl text-sm text-white/55 transition hover:text-white disabled:opacity-40"
              >
                Withdraw all credits
              </button>
            )}
            {meter.txError && <p className="mt-3 text-sm text-red-300">{meter.txError}</p>}
            {meter.lastTx && !busy && !meter.txError && (
              <a
                href={buildTxExplorerUrl(ARC_CHAIN_ID, meter.lastTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-300 hover:underline"
              >
                Confirmed onchain <ExternalLink className="size-3.5" />
              </a>
            )}
          </>
        )}
      </div>
    </section>
  )
}
