function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.board            = document.querySelector(".game-container");

  this.score = 0;
}

HTMLActuator.prototype.prefersReducedMotion = function () {
  return window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);
    self.announceBoard(grid);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile, decorative) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;
  if (decorative) {
    wrapper.setAttribute("aria-hidden", "true");
  } else {
    wrapper.setAttribute("role", "img");
    wrapper.setAttribute("aria-label", String(tile.value));
  }

  if (tile.previousPosition && !this.prefersReducedMotion()) {
    // Second frame so the start transform actually paints before travel.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        classes[2] = self.positionClass({ x: tile.x, y: tile.y });
        self.applyClasses(wrapper, classes);
      });
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged (visual only)
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged, true);
    });
  } else if (!tile.previousPosition) {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  var difference = score - this.score;
  this.score = score;

  var value = this.scoreContainer.querySelector(".score-value");
  if (value) {
    value.textContent = this.score;
    value.classList.remove("is-hot");
    if (difference > 0) {
      void value.offsetWidth;
      value.classList.add("is-hot");
    }
  } else {
    this.scoreContainer.textContent = this.score;
  }

  var previous = this.scoreContainer.querySelector(".score-addition");
  if (previous) this.scoreContainer.removeChild(previous);

  if (difference > 0) {
    var addition = document.createElement("span");
    addition.classList.add("score-addition");
    addition.setAttribute("aria-hidden", "true");
    addition.textContent = "+" + difference;
    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  var value = this.bestContainer.querySelector(".score-value");
  if (value) {
    value.textContent = bestScore;
  } else {
    this.bestContainer.textContent = bestScore;
  }
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.announceBoard = function (grid) {
  if (!this.board) return;

  var highest = 0;
  grid.cells.forEach(function (column) {
    column.forEach(function (cell) {
      if (cell && cell.value > highest) highest = cell.value;
    });
  });

  this.board.setAttribute(
    "aria-label",
    highest
      ? "Board. Highest tile " + highest + ". Drag, swipe, or use arrow keys."
      : "Board. Drag, swipe, or use arrow keys."
  );
};
