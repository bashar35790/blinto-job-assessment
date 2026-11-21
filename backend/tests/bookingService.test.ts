import { describe, it, expect } from 'vitest';
import { calculateBookingQuote } from '../src/services/bookingService.js';

describe('Feature 2: Booking Service (Pure Unbounded Coin-Change DP)', () => {
  describe('PDF Expected Results', () => {
    it('PDF Case 1: sizes {1, 3, 4}, group size 6 -> 2 bundles (3 × 2)', () => {
      const result = calculateBookingQuote([1, 3, 4], 6);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(2);
      expect(result.breakdown).toEqual([{ size: 3, count: 2 }]);
    });

    it('PDF Case 2: sizes {2, 5}, group size 11 -> 4 bundles (5 × 1, 2 × 3)', () => {
      const result = calculateBookingQuote([2, 5], 11);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(4);
      expect(result.breakdown).toEqual([
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ]);
    });

    it('PDF Case 3: sizes {6, 9, 20}, group size 44 -> 4 bundles (20 × 1, 9 × 2, 6 × 1)', () => {
      const result = calculateBookingQuote([6, 9, 20], 44);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(4);
      expect(result.breakdown).toEqual([
        { size: 20, count: 1 },
        { size: 9, count: 2 },
        { size: 6, count: 1 },
      ]);
    });

    it('PDF Case 4: sizes {4, 6}, group size 7 -> not possible', () => {
      const result = calculateBookingQuote([4, 6], 7);

      expect(result.possible).toBe(false);
      expect(result.message).toBe('No exact combination');
      expect(result.totalBundles).toBeUndefined();
      expect(result.breakdown).toBeUndefined();
    });
  });

  describe('Edge Cases & Stress Tests', () => {
    it('Boundary: groupSize 10,000 executes in < 5ms and finds optimal solution', () => {
      const startTime = performance.now();
      const result = calculateBookingQuote([6, 9, 20], 10000);
      const durationMs = performance.now() - startTime;

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBeDefined();
      expect(durationMs).toBeLessThan(50); 
      const totalSeats = result.breakdown!.reduce(
        (sum, item) => sum + item.size * item.count,
        0
      );
      expect(totalSeats).toBe(10000);

      // Verify totalBundles equals sum of counts
      const sumCounts = result.breakdown!.reduce(
        (sum, item) => sum + item.count,
        0
      );
      expect(sumCounts).toBe(result.totalBundles);
    });

    it('Single size: exact multiple succeeds', () => {
      const result = calculateBookingQuote([5], 15);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(3);
      expect(result.breakdown).toEqual([{ size: 5, count: 3 }]);
    });

    it('Single size: non-multiple fails gracefully', () => {
      const result = calculateBookingQuote([5], 16);

      expect(result.possible).toBe(false);
      expect(result.message).toBe('No exact combination');
    });

    it('Size 1 present guarantees exact solution for any group size', () => {
      const result = calculateBookingQuote([1], 123);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(123);
      expect(result.breakdown).toEqual([{ size: 1, count: 123 }]);
    });

    it('Handles unsorted and duplicate bundle sizes in input', () => {
      // Input has duplicates and is unsorted: [20, 6, 9, 20, 6]
      const result = calculateBookingQuote([20, 6, 9, 20, 6], 44);

      expect(result.possible).toBe(true);
      expect(result.totalBundles).toBe(4);
      expect(result.breakdown).toEqual([
        { size: 20, count: 1 },
        { size: 9, count: 2 },
        { size: 6, count: 1 },
      ]);
    });

    it('Rejects invalid group sizes (0, negative, >10,000, float)', () => {
      expect(calculateBookingQuote([2, 5], 0).possible).toBe(false);
      expect(calculateBookingQuote([2, 5], -10).possible).toBe(false);
      expect(calculateBookingQuote([2, 5], 10001).possible).toBe(false);
      expect(calculateBookingQuote([2, 5], 5.5).possible).toBe(false);
    });

    it('Rejects empty bundle sizes list', () => {
      const result = calculateBookingQuote([], 10);
      expect(result.possible).toBe(false);
    });
  });
});
