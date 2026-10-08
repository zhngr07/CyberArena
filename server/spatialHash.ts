/**
 * High-performance 2D Spatial Hash Grid for O(1) collision queries
 * Used for bullet-player, bullet-obstacle, player-powerup, and explosion queries.
 */
export class SpatialHashGrid<T extends { x: number; y: number; id: string }> {
  private cellSize: number;
  private grid: Map<string, Set<T>> = new Map();

  constructor(cellSize: number = 128) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  public clear() {
    this.grid.clear();
  }

  public insert(item: T, radius: number = 0) {
    const minCx = Math.floor((item.x - radius) / this.cellSize);
    const maxCx = Math.floor((item.x + radius) / this.cellSize);
    const minCy = Math.floor((item.y - radius) / this.cellSize);
    const maxCy = Math.floor((item.y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        let cell = this.grid.get(key);
        if (!cell) {
          cell = new Set();
          this.grid.set(key, cell);
        }
        cell.add(item);
      }
    }
  }

  public query(x: number, y: number, radius: number): T[] {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    const results = new Set<T>();

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const item of cell) {
            results.add(item);
          }
        }
      }
    }

    return Array.from(results);
  }
}
