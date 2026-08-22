(function (global) {
  var Tile = global.Tile;
  var Grid = global.Grid;

  var VECTORS = {
    0: { x: 0, y: -1 },
    1: { x: 1, y: 0 },
    2: { x: 0, y: 1 },
    3: { x: -1, y: 0 }
  };

  function getVector(direction) {
    return VECTORS[direction];
  }

  function buildTraversals(size, vector) {
    var traversals = { x: [], y: [] };
    var pos;
    for (pos = 0; pos < size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();
    return traversals;
  }

  function positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  function findFarthestPosition(grid, cell, vector) {
    var previous;
    var next = cell;
    do {
      previous = next;
      next = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (grid.withinBounds(next) && grid.cellAvailable(next));
    return { farthest: previous, next: next };
  }

  function prepareTiles(grid) {
    grid.eachCell(function (x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }

  function moveTile(grid, tile, cell) {
    grid.cells[tile.x][tile.y] = null;
    grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }

  function tileMatchesAvailable(grid) {
    var x, y, direction, tile, vector, other;
    for (x = 0; x < grid.size; x++) {
      for (y = 0; y < grid.size; y++) {
        tile = grid.cellContent({ x: x, y: y });
        if (!tile) continue;
        for (direction = 0; direction < 4; direction++) {
          vector = getVector(direction);
          other = grid.cellContent({ x: x + vector.x, y: y + vector.y });
          if (other && other.value === tile.value) return true;
        }
      }
    }
    return false;
  }

  function movesAvailable(grid) {
    return grid.cellsAvailable() || tileMatchesAvailable(grid);
  }

  function applyMove(grid, direction) {
    var vector = getVector(direction);
    var traversals = buildTraversals(grid.size, vector);
    var moved = false;
    var scoreDelta = 0;
    var won = false;

    prepareTiles(grid);

    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        var cell = { x: x, y: y };
        var tile = grid.cellContent(cell);
        if (!tile) return;

        var positions = findFarthestPosition(grid, cell, vector);
        var next = grid.cellContent(positions.next);

        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];
          grid.insertTile(merged);
          grid.removeTile(tile);
          tile.updatePosition(positions.next);
          scoreDelta += merged.value;
          if (merged.value === 2048) won = true;
        } else {
          moveTile(grid, tile, positions.farthest);
        }

        if (!positionsEqual(cell, tile)) moved = true;
      });
    });

    return { moved: moved, scoreDelta: scoreDelta, won: won };
  }

  function spawnTile(grid, random) {
    if (!grid.cellsAvailable()) return null;
    var value = random() < 0.9 ? 2 : 4;
    var tile = new Tile(grid.randomAvailableCell(random), value);
    grid.insertTile(tile);
    return tile;
  }

  var api = {
    getVector: getVector,
    applyMove: applyMove,
    spawnTile: spawnTile,
    movesAvailable: movesAvailable
  };

  global.GameKernel = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
