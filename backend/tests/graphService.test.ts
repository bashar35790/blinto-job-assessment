import { describe, it, expect } from 'vitest';
import {
  hasCycle,
  computeRewatchOrder,
  MovieNode,
} from '../src/services/graphService.js';

describe('Feature 1: Graph Service (Pure Algorithms)', () => {
  const moviesList: MovieNode[] = [
    { id: 1, title: 'Iron Man', runtimeMinutes: 126, watched: false },
    { id: 2, title: 'Captain America: The First Avenger', runtimeMinutes: 124, watched: false },
    { id: 3, title: 'The Avengers', runtimeMinutes: 143, watched: false },
    { id: 4, title: 'Captain America: Civil War', runtimeMinutes: 147, watched: false },
    { id: 5, title: 'Thor: Ragnarok', runtimeMinutes: 130, watched: false },
    { id: 6, title: 'Avengers: Infinity War', runtimeMinutes: 149, watched: false },
    { id: 7, title: 'Avengers: Endgame', runtimeMinutes: 181, watched: false },
    { id: 8, title: 'Avengers: Doomsday', runtimeMinutes: 180, watched: false },
  ];

  const moviesMap = new Map<number, MovieNode>(
    moviesList.map((m) => [m.id, m])
  );

  const mcuAdjList = new Map<number, number[]>([
    [1, []],
    [2, []],
    [3, [1, 2]],
    [4, [3]],
    [5, []],
    [6, [4, 5]],
    [7, [6]],
    [8, [7]],
  ]);

  describe('Rewatch Order Calculations (PDF Expected Results)', () => {
    it('PDF Case 1: Rewatch order for Avengers: Doomsday returns all 7 other movies in valid order', () => {
      const result = computeRewatchOrder(8, mcuAdjList, moviesMap);

      expect(result.totalCount).toBe(7);
      expect(result.order).toHaveLength(7);

      const orderedIds = result.order.map((m) => m.id);

      // Target (8: Avengers: Doomsday) must NOT be included
      expect(orderedIds).not.toContain(8);

      expect(orderedIds).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6, 7]));

      // Verify topological ordering constraints:
      expect(orderedIds.indexOf(1)).toBeLessThan(orderedIds.indexOf(3));
      expect(orderedIds.indexOf(2)).toBeLessThan(orderedIds.indexOf(3));

      expect(orderedIds.indexOf(3)).toBeLessThan(orderedIds.indexOf(4));

      // 4 (Civil War) and 5 (Ragnarok) must appear before 6 (Infinity War)
      expect(orderedIds.indexOf(4)).toBeLessThan(orderedIds.indexOf(6));
      expect(orderedIds.indexOf(5)).toBeLessThan(orderedIds.indexOf(6));

      // 6 (Infinity War) must appear before 7 (Endgame)
      expect(orderedIds.indexOf(6)).toBeLessThan(orderedIds.indexOf(7));

      // Watched & runtime metrics
      expect(result.watchedCount).toBe(0);
      const expectedRuntime = 126 + 124 + 143 + 147 + 130 + 149 + 181;
      expect(result.remainingRuntimeMinutes).toBe(expectedRuntime);
    });

    it('PDF Case 2: Rewatch order for Captain America: Civil War returns Iron Man & First Avenger, then The Avengers', () => {
      const result = computeRewatchOrder(4, mcuAdjList, moviesMap);

      expect(result.totalCount).toBe(3);
      const orderedIds = result.order.map((m) => m.id);

      // Target (4: Civil War) must NOT be included
      expect(orderedIds).not.toContain(4);

      // Must contain exactly 1, 2, 3
      expect(orderedIds).toEqual(expect.arrayContaining([1, 2, 3]));

      // Both Iron Man (1) and First Avenger (2) must precede The Avengers (3)
      expect(orderedIds.indexOf(1)).toBeLessThan(orderedIds.indexOf(3));
      expect(orderedIds.indexOf(2)).toBeLessThan(orderedIds.indexOf(3));
    });

    it('PDF Case 3: Rewatch order for Thor: Ragnarok returns an empty list', () => {
      const result = computeRewatchOrder(5, mcuAdjList, moviesMap);

      expect(result.totalCount).toBe(0);
      expect(result.order).toEqual([]);
      expect(result.watchedCount).toBe(0);
      expect(result.remainingRuntimeMinutes).toBe(0);
    });
  });

  describe('Cycle Detection (PDF Expected Results & Edge Cases)', () => {
    it('PDF Case 4: Making Avengers: Endgame a prerequisite of Iron Man detects cycle', () => {
      // Iron Man is ID 1; Endgame is ID 7
      // 1 -> 7 creates cycle because 7 -> 6 -> 4 -> 3 -> 1
      const cycleDetected = hasCycle(mcuAdjList, 1, [7]);
      expect(cycleDetected).toBe(true);
    });

    it('Edge Case: Direct self-dependency (A depends on A) is detected', () => {
      const cycleDetected = hasCycle(mcuAdjList, 1, [1]);
      expect(cycleDetected).toBe(true);
    });

    it('Edge Case: Valid prerequisite update introduces no cycle', () => {
      const cycleDetected = hasCycle(mcuAdjList, 4, [3, 2]);
      expect(cycleDetected).toBe(false);
    });

    it('Edge Case: Indirect 3-node cycle (A -> B -> C -> A) is detected', () => {
      const simpleAdj = new Map<number, number[]>([
        [10, [20]],
        [20, [30]],
        [30, []],
      ]);
      // Making 30 depend on 10 creates 10 -> 20 -> 30 -> 10
      const cycleDetected = hasCycle(simpleAdj, 30, [10]);
      expect(cycleDetected).toBe(true);
    });
  });

  describe('Diamond Dependencies and Watched Metrics', () => {
    it('Diamond dependency includes shared prerequisites exactly once in valid order', () => {
      const diamondMovies = new Map<number, MovieNode>([
        [100, { id: 100, title: 'Target', runtimeMinutes: 120, watched: false }],
        [101, { id: 101, title: 'Branch A', runtimeMinutes: 100, watched: false }],
        [102, { id: 102, title: 'Branch B', runtimeMinutes: 110, watched: false }],
        [103, { id: 103, title: 'Shared Base', runtimeMinutes: 90, watched: true }],
      ]);

      const diamondAdj = new Map<number, number[]>([
        [100, [101, 102]],
        [101, [103]],
        [102, [103]],
        [103, []],
      ]);

      const result = computeRewatchOrder(100, diamondAdj, diamondMovies);

      expect(result.totalCount).toBe(3);
      const ids = result.order.map((m) => m.id);

      // 103 must appear once, and before both 101 and 102
      expect(ids.filter((id) => id === 103)).toHaveLength(1);
      expect(ids.indexOf(103)).toBeLessThan(ids.indexOf(101));
      expect(ids.indexOf(103)).toBeLessThan(ids.indexOf(102));

      expect(result.watchedCount).toBe(1);
      expect(result.remainingRuntimeMinutes).toBe(210);
    });

    it('Correctly calculates watchedCount and remainingRuntimeMinutes with mixed watch states', () => {
      const customMovies = new Map<number, MovieNode>(moviesMap);
      customMovies.set(1, { ...customMovies.get(1)!, watched: true });
      customMovies.set(3, { ...customMovies.get(3)!, watched: true });

      const result = computeRewatchOrder(4, mcuAdjList, customMovies);

      expect(result.totalCount).toBe(3);
      expect(result.watchedCount).toBe(2); 

      expect(result.remainingRuntimeMinutes).toBe(124);
    });
  });
});
