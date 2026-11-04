import type { Address, Hex } from 'viem'
import { formatUsdc } from '@/onchain-money'

export const ARC_CHAIN_ID = 5042002

export const METER_ADDRESS = import.meta.env.VITE_NANOMETER_ADDRESS as Address | undefined
export const METER_DEPLOY_BLOCK = BigInt(String(import.meta.env.VITE_NANOMETER_DEPLOY_BLOCK ?? '0'))

export const KINDS = [
  { id: 0, label: 'Block snapshot', blurb: 'Block number and timestamp, stamped by the chain at the moment you pay.' },
  { id: 1, label: 'Entropy', blurb: 'A 32-byte seed derived from chain state, unique to each payment.' },
  { id: 2, label: 'Micro haiku', blurb: 'A three-line haiku generated from the payment seed.' },
] as const

export interface Service {
  id: number
  seller: Address
  kind: number
  active: boolean
  price: bigint
  name: string
}

export interface PaidResult {
  serviceId: number
  price: bigint
  seed: Hex
  blockNumber: bigint
  timestamp: bigint
  txHash: Hex
}

const OPENERS = ['Quiet ledger glows', 'Small coins drift past', 'Blocks settle like snow', 'Signatures bloom']
const MIDDLES = ['a thousandth of a dollar', 'no toll upon the wind', 'batched at the river bend', 'dollars move like light']
const CLOSERS = ['the balance remains', 'value finds its home', 'one more call, then rest', 'finality, sub-second']

/** Turn a payment's seed into the product the buyer paid for. */
export function resultFor(kind: number, paid: PaidResult): Record<string, string> {
  if (kind === 0) {
    return {
      blockNumber: paid.blockNumber.toString(),
      timestamp: new Date(Number(paid.timestamp) * 1000).toISOString(),
    }
  }
  if (kind === 1) return { seed: paid.seed }
  const bytes = paid.seed.slice(2)
  const pick = (list: string[], offset: number) => list[parseInt(bytes.slice(offset, offset + 2), 16) % list.length]
  return { line1: pick(OPENERS, 0), line2: pick(MIDDLES, 2), line3: pick(CLOSERS, 4) }
}

export const kindLabel = (kind: number) => KINDS[kind]?.label ?? 'Service'

/** "$0.001" style label from USDC base units. */
export function priceLabel(price: bigint): string {
  const [whole, frac = ''] = formatUsdc(price).split('.')
  return `$${whole}.${frac.replace(/0+$/, '').padEnd(2, '0')}`
}

export function shortAddress(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export function trimUsdc(value: string): string {
  const [whole, frac = ''] = value.split('.')
  return `${whole}.${frac.replace(/0+$/, '').padEnd(2, '0')}`
}

export function parseOnchainError(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase()
  if (message.includes('user rejected') || message.includes('user denied')) return 'Cancelled in wallet.'
  if (message.includes('insufficient funds') || message.includes('exceeds balance')) return 'Insufficient balance for this action.'
  if (message.includes('insufficientcredits')) return 'Not enough credits. Deposit more USDC first.'
  if (message.includes('inactiveservice')) return 'This service is paused by its seller.'
  if (message.includes('noearnings')) return 'No earnings to withdraw yet.'
  if (message.includes('priceexceedsmaximum')) return 'The seller changed the price. Refresh and try again.'
  if (message.includes('network') || message.includes('timeout')) return 'Network issue. Check your connection and retry.'
  return 'Something went wrong. Please try again.'
}
