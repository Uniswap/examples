export function tickToWordCompressed(
  tick: number,
  tickSpacing: number
): number {
  let compressed = Math.floor(tick / tickSpacing)
  if (tick < 0 && tick % tickSpacing !== 0) {
    compressed -= 1
  }
  return tickToWord(compressed)
}

function tickToWord(tick: number): number {
  return tick >> 8
}
