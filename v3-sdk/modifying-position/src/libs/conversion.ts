export function fromReadableAmount(amount: number, decimals: number): bigint {
  const extraDigits = Math.pow(10, countDecimals(amount))
  const adjustedAmount = amount * extraDigits
  return (
    (BigInt(adjustedAmount) * 10n ** BigInt(decimals)) / BigInt(extraDigits)
  )
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return (BigInt(rawAmount) / 10n ** BigInt(decimals)).toString(10)
}

function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0
  }
  return x.toString().split('.')[1].length || 0
}
