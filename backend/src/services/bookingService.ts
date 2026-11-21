export interface BundleBreakdownItem {
  size: number;
  count: number;
}

export interface BundleQuoteResult {
  possible: boolean;
  totalBundles?: number;
  breakdown?: BundleBreakdownItem[];
  message?: string;
}
export function calculateBookingQuote(
  bundleSizes: number[],
  groupSize: number
): BundleQuoteResult {
  if (!Number.isInteger(groupSize) || groupSize <= 0 || groupSize > 10000) {
    return {
      possible: false,
      message: "Group size must be an integer between 1 and 10,000",
    };
  }

  // Deduplicate and filter valid positive bundle sizes, sorted ASCENDING for tie-breaking
  const sizes = Array.from(new Set(bundleSizes))
    .filter((s) => Number.isInteger(s) && s > 0 && s <= 500)
    .sort((a, b) => a - b);

  if (sizes.length === 0) {
    return {
      possible: false,
      message: "Cinema has no valid bundle sizes available",
    };
  }

  const dp: number[] = new Array(groupSize + 1).fill(Infinity);
  const choice: number[] = new Array(groupSize + 1).fill(-1);

  dp[0] = 0;

  for (let i = 1; i <= groupSize; i++) {
    for (const size of sizes) {
      if (size > i) {
        break;
      }

      if (dp[i - size] !== Infinity) {
        const candidateCount = dp[i - size] + 1;

        if (candidateCount < dp[i]) {
          dp[i] = candidateCount;
          choice[i] = size;
        }
      }
    }
  }

  if (dp[groupSize] === Infinity) {
    return {
      possible: false,
      message: "No exact combination",
    };
  }

  const bundleCounts = new Map<number, number>();
  let currentRemaining = groupSize;

  while (currentRemaining > 0) {
    const chosenSize = choice[currentRemaining];
    if (chosenSize <= 0) {
      return {
        possible: false,
        message: "No exact combination",
      };
    }

    bundleCounts.set(chosenSize, (bundleCounts.get(chosenSize) || 0) + 1);
    currentRemaining -= chosenSize;
  }
  const breakdown: BundleBreakdownItem[] = Array.from(bundleCounts.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    totalBundles: dp[groupSize],
    breakdown,
  };
}
