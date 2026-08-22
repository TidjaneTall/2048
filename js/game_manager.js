function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size;
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;
  this.kernel         = globalThis.GameKernel;

  this.startTiles     = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.continueAfterWin.bind(this));

  this.setup();
}

GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame();
  this.setup();
};

GameManager.prototype.continueAfterWin = function () {
  this.continuePlaying = true;
  this.actuator.continueGame();
};

GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.continuePlaying);
};

GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  if (previousState) {
    this.grid            = new Grid(previousState.grid.size, previousState.grid.cells);
    this.score           = previousState.score;
    this.over            = previousState.over;
    this.won             = previousState.won;
    this.continuePlaying = previousState.keepPlaying;
  } else {
    this.grid            = new Grid(this.size);
    this.score           = 0;
    this.over            = false;
    this.won             = false;
    this.continuePlaying = false;

    this.addStartTiles();
  }

  this.actuate();
};

GameManager.prototype.addStartTiles = function () {
  var i;
  for (i = 0; i < this.startTiles; i++) {
    this.kernel.spawnTile(this.grid, Math.random);
  }
};

GameManager.prototype.actuate = function () {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  });
};

GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.continuePlaying
  };
};

GameManager.prototype.move = function (direction) {
  if (this.isGameTerminated()) return;

  var result = this.kernel.applyMove(this.grid, direction);
  if (!result.moved) return;

  this.score += result.scoreDelta;
  if (result.won) this.won = true;

  this.kernel.spawnTile(this.grid, Math.random);

  if (!this.kernel.movesAvailable(this.grid)) {
    this.over = true;
  }

  this.actuate();
};
