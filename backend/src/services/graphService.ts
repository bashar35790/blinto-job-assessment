export interface MovieNode {
  id: number;
  title: string;
  runtimeMinutes: number;
  watched: boolean;
  releaseYear?: number;
}

export interface RewatchOrderItem {
  id: number;
  title: string;
  runtimeMinutes: number;
  watched: boolean;
}

export interface RewatchOrderResult {
  order: RewatchOrderItem[];
  watchedCount: number;
  totalCount: number;
  remainingRuntimeMinutes: number;
}
export function hasCycle(
  adjList: Map<number, number[]>,
  movieId: number,
  proposedPrereqs: number[]
): boolean {
  if (proposedPrereqs.includes(movieId)) {
    return true;
  }
  const testAdj = new Map<number, number[]>();
  for (const [key, neighbors] of adjList.entries()) {
    testAdj.set(key, [...neighbors]);
  }
  testAdj.set(movieId, [...proposedPrereqs]);
  testAdj.set(movieId, [...proposedPrereqs]);
  const colors = new Map<number, number>();
  function dfs(currentId: number): boolean {
    colors.set(currentId, 1);

    const prerequisites = testAdj.get(currentId) || [];
    for (const prereqId of prerequisites) {
      const neighborColor = colors.get(prereqId) || 0;

      if (neighborColor === 1) {
        return true;
      }
      if (neighborColor === 0) {
        if (dfs(prereqId)) {
          return true;
        }
      }
    }

    colors.set(currentId, 2);
    return false;
  }

  return dfs(movieId);
}
export function computeRewatchOrder(
  targetMovieId: number,
  adjList: Map<number, number[]>,
  moviesMap: Map<number, MovieNode>
): RewatchOrderResult {
  const visited = new Set<number>();
  const order: RewatchOrderItem[] = [];
  function dfs(currentId: number) {
    const prerequisites = adjList.get(currentId) || [];

    for (const prereqId of prerequisites) {
      if (!visited.has(prereqId)) {
        visited.add(prereqId);

        dfs(prereqId);

        const movie = moviesMap.get(prereqId);
        if (movie) {
          order.push({
            id: movie.id,
            title: movie.title,
            runtimeMinutes: movie.runtimeMinutes,
            watched: movie.watched,
          });
        }
      }
    }
  }

  dfs(targetMovieId);

  // Compute rewatch metrics
  const watchedCount = order.filter((m) => m.watched).length;
  const remainingRuntimeMinutes = order
    .filter((m) => !m.watched)
    .reduce((total, m) => total + m.runtimeMinutes, 0);

  return {
    order,
    watchedCount,
    totalCount: order.length,
    remainingRuntimeMinutes,
  };
}
