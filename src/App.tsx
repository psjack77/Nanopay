import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { Wallet } from 'lucide-react'
import { BalanceCard } from '@/components/BalanceCard'
import { Catalog } from '@/components/Catalog'
import { Receipts } from '@/components/Receipts'
import { SellerView } from '@/components/SellerView'
import { useMeter } from '@/hooks/useMeter'
import { shortAddress } from '@/lib/meter'

type Tab = 'buy' | 'sell'

export default function App() {
  const [tab, setTab] = useState<Tab>('buy')
  const meter = useMeter()

  const cheapest = meter.services.filter((s) => s.active).reduce((min, s) => (s.price < min ? s.price : min), 2n ** 96n)

  let disabledReason: string | null = null
  if (!meter.isConnected) disabledReason = 'Connect a wallet to pay.'
  else if (meter.isWrongChain) disabledReason = 'Switch to Arc Testnet.'
  else if (meter.creditsRaw < cheapest) disabledReason = 'Add credits to start paying.'

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_500px_at_50%_-10%,#16264a,transparent)] pb-24">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-arc-300 font-display text-sm font-bold text-ink-950">n</div>
          <span className="font-display text-lg font-semibold tracking-[-0.02em]">Nanopay</span>
        </div>
        <nav className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1" aria-label="View">
          {(['buy', 'sell'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={`h-9 min-w-[72px] rounded-lg px-4 text-sm font-medium capitalize transition ${
                tab === t ? 'bg-arc-300 text-ink-950' : 'text-white/60 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
        <ConnectKitButton.Custom>
          {({ isConnected, show, address }) => (
            <button
              onClick={show}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 font-mono text-xs text-white/80 transition hover:bg-white/10"
            >
              <Wallet className="size-4" />
              <span className="hidden sm:inline">{isConnected && address ? shortAddress(address) : 'Connect'}</span>
            </button>
          )}
        </ConnectKitButton.Custom>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        {!meter.enabled && (
          <p className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            The contract address is not configured for this build.
          </p>
        )}
        {meter.enabled && tab === 'buy' && (
          <>
            <div className="mb-6 max-w-xl">
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-balance">
                Pay for services by the call, in fractions of a cent.
              </h1>
              <p className="mt-3 text-pretty text-white/55">
                Add USDC credits to a contract once, then each call is one tiny transaction on Arc Testnet. No server, no accounts.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
              <div className="lg:sticky lg:top-6 lg:h-fit">
                <BalanceCard meter={meter} />
              </div>
              <div className="grid gap-8">
                <Catalog
                  services={meter.services}
                  loading={meter.servicesLoading}
                  calls={meter.calls}
                  canPay={disabledReason === null}
                  disabledReason={disabledReason}
                  onPay={(service) => void meter.pay(service)}
                />
                <Receipts calls={meter.calls} />
              </div>
            </div>
          </>
        )}
        {meter.enabled && tab === 'sell' && (
          <>
            <h1 className="mb-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em]">Seller dashboard</h1>
            <SellerView meter={meter} />
          </>
        )}
      </main>
    </div>
  )
}
