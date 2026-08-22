const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

require("../js/tile.js");
require("../js/grid.js");
const kernel = require("../js/kernel.js");

function row(values) {
  const grid = new globalThis.Grid(4);
  values.forEach(function (value, x) {
    if (value) {
      grid.insertTile(new globalThis.Tile({ x: x, y: 0 }, value));
    }
  });
  return grid;
}

function rowValues(grid) {
  const out = [];
  for (let x = 0; x < 4; x++) {
    const tile = grid.cellContent({ x: x, y: 0 });
    out.push(tile ? tile.value : 0);
  }
  return out;
}

describe("applyMove", function () {
  it("slides as far as possible", function () {
    const grid = row([2, 0, 0, 0]);
    const result = kernel.applyMove(grid, 1);
    assert.equal(result.moved, true);
    assert.deepEqual(rowValues(grid), [0, 0, 0, 2]);
  });

  it("merges equal tiles once per move", function () {
    const grid = row([2, 2, 2, 2]);
    const result = kernel.applyMove(grid, 3);
    assert.equal(result.moved, true);
    assert.equal(result.scoreDelta, 8);
    assert.deepEqual(rowValues(grid), [4, 4, 0, 0]);
  });

  it("does not chain-merge in one swipe", function () {
    const grid = row([2, 2, 4, 0]);
    const result = kernel.applyMove(grid, 3);
    assert.equal(result.scoreDelta, 4);
    assert.deepEqual(rowValues(grid), [4, 4, 0, 0]);
  });

  it("sets won when a 2048 tile is created", function () {
    const grid = row([1024, 1024, 0, 0]);
    const result = kernel.applyMove(grid, 3);
    assert.equal(result.won, true);
    assert.equal(result.scoreDelta, 2048);
    assert.deepEqual(rowValues(grid), [2048, 0, 0, 0]);
  });
});

describe("spawnTile", function () {
  it("spawns 2 when random is below 0.9", function () {
    const grid = new globalThis.Grid(4);
    const tile = kernel.spawnTile(grid, function () { return 0.5; });
    assert.equal(tile.value, 2);
  });

  it("spawns 4 when random is 0.9 or above", function () {
    const grid = new globalThis.Grid(4);
    const tile = kernel.spawnTile(grid, function () { return 0.9; });
    assert.equal(tile.value, 4);
  });
});

describe("movesAvailable", function () {
  it("is false on a full grid with no neighbors to merge", function () {
    const grid = new globalThis.Grid(4);
    grid.eachCell(function (x, y) {
      grid.insertTile(new globalThis.Tile({ x: x, y: y }, (x + y) % 2 === 0 ? 2 : 4));
    });
    assert.equal(kernel.movesAvailable(grid), false);
  });

  it("is true when two neighbors can merge", function () {
    const grid = new globalThis.Grid(4);
    grid.insertTile(new globalThis.Tile({ x: 0, y: 0 }, 2));
    grid.insertTile(new globalThis.Tile({ x: 1, y: 0 }, 2));
    assert.equal(kernel.movesAvailable(grid), true);
  });
});
