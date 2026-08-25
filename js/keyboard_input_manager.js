function KeyboardInputManager() {
  this.events = {};
  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;
  var map = {
    38: 0, 39: 1, 40: 2, 37: 3,
    75: 0, 76: 1, 74: 2, 72: 3,
    87: 0, 68: 1, 83: 2, 65: 3
  };

  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    var mapped = map[event.which];
    var tag = event.target && event.target.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (!modifiers && mapped !== undefined) {
      event.preventDefault();
      self.emit("move", mapped);
    }

    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  this.bindButtonPress(".retry-button", this.restart);
  this.bindButtonPress(".restart-button", this.restart);
  this.bindButtonPress(".keep-playing-button", this.keepPlaying);

  this.bindDockPanels();
  this.bindBoardGestures();
};

KeyboardInputManager.prototype.bindBoardGestures = function () {
  var self = this;
  var board = document.querySelector(".game-container");
  if (!board) return;

  var pointerId = null;
  var startX = 0;
  var startY = 0;
  var threshold = 24;

  var intents = ["intent-up", "intent-right", "intent-down", "intent-left"];

  function clearIntent() {
    board.classList.remove.apply(board.classList, intents.concat(["is-dragging"]));
  }

  function direction(dx, dy) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
  }

  function setIntent(dir) {
    board.classList.remove.apply(board.classList, intents);
    if (dir === 0) board.classList.add("intent-up");
    if (dir === 1) board.classList.add("intent-right");
    if (dir === 2) board.classList.add("intent-down");
    if (dir === 3) board.classList.add("intent-left");
  }

  board.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest("button")) return;
    if (pointerId !== null) return;

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    board.classList.add("is-dragging");
    board.focus({ preventScroll: true });

    try {
      board.setPointerCapture(event.pointerId);
    } catch (error) {}
  });

  board.addEventListener("pointermove", function (event) {
    if (event.pointerId !== pointerId) return;
    setIntent(direction(event.clientX - startX, event.clientY - startY));
  });

  function endPointer(event) {
    if (event.pointerId !== pointerId) return;

    var dir = direction(event.clientX - startX, event.clientY - startY);
    pointerId = null;
    clearIntent();

    if (dir !== null) self.emit("move", dir);
  }

  board.addEventListener("pointerup", endPointer);
  board.addEventListener("pointercancel", endPointer);
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  if (!button) return;
  button.addEventListener("click", fn.bind(this));
};

KeyboardInputManager.prototype.bindDockPanels = function () {
  var items = [
    {
      button: document.querySelector(".info-button"),
      panel: document.getElementById("info-panel")
    },
    {
      button: document.querySelector(".settings-button"),
      panel: document.getElementById("settings-panel")
    }
  ].filter(function (item) {
    return item.button && item.panel;
  });

  function closeAll(except) {
    items.forEach(function (item) {
      var open = item === except;
      item.panel.hidden = !open;
      item.button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  items.forEach(function (item) {
    item.button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeAll(item.panel.hidden ? item : null);
    });
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest(".sheet")) return;
    closeAll(null);
  });

  document.addEventListener("keydown", function (event) {
    if (event.which !== 27) return;
    var open = items.filter(function (item) {
      return !item.panel.hidden;
    })[0];
    closeAll(null);
    if (open) open.button.focus();
  });
};
