import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi'
import { erc20Abi, parseEventLogs, type Address } from 'viem'
import { getUsdc } from '@/onchain-facts'
import { formatUsdc, parseUsdc } from '@/onchain-money'
import { meterAbi } from '@/lib/meter-abi'
import {
  ARC_CHAIN_ID,
  METER_ADDRESS,
  METER_DEPLOY_BLOCK,
  parseOnchainError,
  type PaidResult,
  type Service,
} from '@/lib/meter'

export type TxStep = 'idle' | 'approving' | 'depositing' | 'confirming'

export interface CallRecord {
  id: string
  service: Service
  status: 'paying' | 'success' | 'error'
  result?: PaidResult
  error?: string
  at: number
}

const meter = METER_ADDRESS as Address
const usdc = getUsdc(ARC_CHAIN_ID)

export function useMeter() {
  const { address, chainId, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID })
  const queryClient = useQueryClient()

  const [step, setStep] = useState<TxStep>('idle')
  const [txError, setTxError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [calls, setCalls] = useState<CallRecord[]>([])

  const isWrongChain = isConnected && chainId !== ARC_CHAIN_ID
  const enabled = Boolean(METER_ADDRESS)

  const count = useReadContract({
    address: meter,
    abi: meterAbi,
    functionName: 'serviceCount',
    chainId: ARC_CHAIN_ID,
    query: { enabled, refetchInterval: 15_000 },
  })

  const ids = useMemo(() => Array.from({ length: Number(count.data ?? 0n) }, (_, i) => i), [count.data])
  const serviceReads = useReadContracts({
    contracts: ids.map((id) => ({ address: meter, abi: meterAbi, functionName: 'getService', args: [BigInt(id)], chainId: ARC_CHAIN_ID }) as const),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  })
  const services: Service[] = useMemo(
    () =>
      (serviceReads.data ?? []).flatMap((entry, i) =>
        entry.status === 'success' && entry.result
          ? [{ id: ids[i], seller: entry.result.seller, kind: entry.result.kind, active: entry.result.active, price: entry.result.price, name: entry.result.name }]
          : [],
      ),
    [serviceReads.data, ids],
  )

  const credits = useReadContract({
    address: meter,
    abi: meterAbi,
    functionName: 'credits',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: enabled && Boolean(address), refetchInterval: 10_000 },
  })
  const earnings = useReadContract({
    address: meter,
    abi: meterAbi,
    functionName: 'earnings',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: enabled && Boolean(address), refetchInterval: 10_000 },
  })
  const wallet = useReadContract({
    address: usdc?.address as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(address && usdc), refetchInterval: 15_000 },
  })

  // Recent payments to this seller. Bounded lookback, never from block 0.
  const payments = useQuery({
    queryKey: ['meter-paid', address],
    enabled: enabled && Boolean(address && publicClient),
    refetchInterval: 8_000,
    queryFn: async () => {
      if (!publicClient || !address) return []
      const head = await publicClient.getBlockNumber()
      const fromBlock = head - 5_000n > METER_DEPLOY_BLOCK ? head - 5_000n : METER_DEPLOY_BLOCK
      const logs = await publicClient.getLogs({
        address: meter,
        event: meterAbi.find((e) => e.type === 'event' && e.name === 'Paid') as never,
        args: { seller: address } as never,
        fromBlock,
        toBlock: head,
      })
      return parseEventLogs({ abi: meterAbi, logs, eventName: 'Paid' }).reverse().slice(0, 30)
    },
  })

  const refresh = useCallback(async () => {
    await Promise.all([count.refetch(), serviceReads.refetch(), credits.refetch(), earnings.refetch(), wallet.refetch()])
    void queryClient.invalidateQueries({ queryKey: ['meter-paid'] })
  }, [count, serviceReads, credits, earnings, wallet, queryClient])

  const ensureChain = useCallback(async () => {
    if (chainId !== ARC_CHAIN_ID) await switchChainAsync({ chainId: ARC_CHAIN_ID })
  }, [chainId, switchChainAsync])

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setTxError(null)
      setLastTx(null)
      try {
        await ensureChain()
        await fn()
        await refresh()
      } catch (error) {
        setTxError(parseOnchainError(error))
      } finally {
        setStep('idle')
      }
    },
    [ensureChain, refresh],
  )

  const send = useCallback(
    async (write: () => Promise<`0x${string}`>) => {
      setStep('confirming')
      const hash = await write()
      setLastTx(hash)
      await publicClient?.waitForTransactionReceipt({ hash })
    },
    [publicClient],
  )

  const deposit = useCallback(
    (amount: string) =>
      run(async () => {
        if (!usdc) return
        const raw = parseUsdc(amount)
        setStep('approving')
        const approveHash = await writeContractAsync({
          address: usdc.address as Address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [meter, raw],
          chainId: ARC_CHAIN_ID,
        })
        await publicClient?.waitForTransactionReceipt({ hash: approveHash })
        setStep('depositing')
        const hash = await writeContractAsync({ address: meter, abi: meterAbi, functionName: 'deposit', args: [raw], chainId: ARC_CHAIN_ID })
        setLastTx(hash)
        setStep('confirming')
        await publicClient?.waitForTransactionReceipt({ hash })
      }),
    [run, writeContractAsync, publicClient],
  )

  const pay = useCallback(
    async (service: Service) => {
      const id = crypto.randomUUID()
      const patch = (p: Partial<CallRecord>) => setCalls((list) => list.map((c) => (c.id === id ? { ...c, ...p } : c)))
      const pending: CallRecord = { id, service, status: 'paying', at: Date.now() }
      setCalls((list) => [pending, ...list].slice(0, 30))
      try {
        await ensureChain()
        const hash = await writeContractAsync({
          address: meter,
          abi: meterAbi,
          functionName: 'pay',
          args: [BigInt(service.id), service.price],
          chainId: ARC_CHAIN_ID,
        })
        const receipt = await publicClient?.waitForTransactionReceipt({ hash })
        const log = receipt && parseEventLogs({ abi: meterAbi, logs: receipt.logs, eventName: 'Paid' })[0]
        if (!log) throw new Error('Payment confirmed but no receipt event found.')
        patch({
          status: 'success',
          result: {
            serviceId: service.id,
            price: log.args.price,
            seed: log.args.seed,
            blockNumber: log.args.blockNumber,
            timestamp: log.args.timestamp,
            txHash: hash,
          },
        })
        void refresh()
      } catch (error) {
        patch({ status: 'error', error: parseOnchainError(error) })
      }
    },
    [ensureChain, writeContractAsync, publicClient, refresh],
  )

  return {
    enabled,
    address,
    isConnected,
    isWrongChain,
    switchToArc: () => switchChainAsync({ chainId: ARC_CHAIN_ID }),
    services,
    servicesLoading: count.isLoading || serviceReads.isLoading,
    credits: credits.data !== undefined ? formatUsdc(credits.data) : null,
    creditsRaw: credits.data ?? 0n,
    earnings: earnings.data !== undefined ? formatUsdc(earnings.data) : null,
    earningsRaw: earnings.data ?? 0n,
    walletUsdc: wallet.data !== undefined ? formatUsdc(wallet.data) : null,
    payments: payments.data ?? [],
    step,
    txError,
    lastTx,
    calls,
    deposit,
    pay,
    withdrawCredits: (amount: bigint) =>
      run(() => send(() => writeContractAsync({ address: meter, abi: meterAbi, functionName: 'withdrawCredits', args: [amount], chainId: ARC_CHAIN_ID }))),
    withdrawEarnings: () =>
      run(() => send(() => writeContractAsync({ address: meter, abi: meterAbi, functionName: 'withdrawEarnings', chainId: ARC_CHAIN_ID }))),
    createService: (kind: number, price: bigint, name: string) =>
      run(() => send(() => writeContractAsync({ address: meter, abi: meterAbi, functionName: 'createService', args: [kind, price, name], chainId: ARC_CHAIN_ID }))),
    setActive: (id: number, active: boolean) =>
      run(() => send(() => writeContractAsync({ address: meter, abi: meterAbi, functionName: 'setServiceActive', args: [BigInt(id), active], chainId: ARC_CHAIN_ID }))),
  }
}

export type Meter = ReturnType<typeof useMeter>
