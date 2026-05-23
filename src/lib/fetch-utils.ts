export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mapWithDelay<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  delayMs = 120
): Promise<R[]> {
  const results: R[] = [];

  for (const [index, item] of items.entries()) {
    if (index > 0 && delayMs > 0) {
      await sleep(delayMs);
    }
    results.push(await mapper(item, index));
  }

  return results;
}
