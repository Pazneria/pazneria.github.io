/*
 * tilegame.js
 *
 * Implements a simple tile‑based idle game. Players control a
 * digital avatar moving around a grid of nodes. Certain tiles
 * allow gathering raw data, processing it into compute cycles,
 * running training to earn XP and levelling up, or purchasing
 * upgrades. Game state is persisted in localStorage so progress
 * carries across sessions. Movement is via mouse clicks on
 * adjacent tiles or arrow keys.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * Configuration and definitions
   */

  // Default game state for new players. This includes resources,
  // level information, upgrade levels and the player’s position on
  // the grid.
  const defaultState = {
    rawData: 0,
    compute: 0,
    xp: 0,
    level: 1,
    xpToNext: 50,
    upgrades: {
      rawDataBoost: 0,
      dataCompression: 0,
      trainingEfficiency: 0,
      webCrawler: 0,
      sensorArray: 0,
    },
    // Starting position of the player on the grid (row, col)
    player: { row: 0, col: 0 },
    lastSaved: null,
  };

  // Definitions for upgrades. Costs scale exponentially with
  // level and effects modify resource generation.
  const upgradeDefs = {
    rawDataBoost: {
      name: 'Better Crawlers',
      description: 'Increase data per gather by 1.',
      baseCost: 10,
      costMultiplier: 1.5,
    },
    dataCompression: {
      name: 'Data Compression',
      description: 'Compute gains per raw data increased by 1.',
      baseCost: 25,
      costMultiplier: 1.8,
    },
    trainingEfficiency: {
      name: 'Optimization Algorithm',
      description: 'XP gained per training run increases by 50%.',
      baseCost: 30,
      costMultiplier: 1.6,
    },
    webCrawler: {
      name: 'Web Crawler',
      description: 'Passively collect raw data each second.',
      baseCost: 15,
      costMultiplier: 1.7,
      baseRate: 0.5,
    },
    sensorArray: {
      name: 'Sensor Array',
      description: 'Passively generate compute cycles each second.',
      baseCost: 50,
      costMultiplier: 2.0,
      baseRate: 0.1,
    },
  };

  // Training run parameters. Running a training run consumes
  // compute and produces XP based on efficiency.
  const trainingDef = {
    cost: 10,
    baseXpGain: 20,
  };

  // Map layout. Each entry corresponds to a tile type. The grid
  // dimensions are 8 rows x 10 columns. Valid types are:
  //   empty      – nothing special
  //   data       – gather raw data here
  //   processor  – convert raw data to compute
  //   lab        – run training to gain XP
  //   workshop   – purchase upgrades
  const mapLayout = [
    ['empty','data','empty','empty','processor','empty','empty','empty','empty','empty'],
    ['empty','empty','empty','empty','empty','empty','empty','empty','empty','empty'],
    ['workshop','empty','empty','lab','empty','empty','data','empty','processor','empty'],
    ['empty','empty','empty','empty','empty','empty','empty','empty','empty','empty'],
    ['data','empty','processor','empty','empty','workshop','empty','empty','empty','empty'],
    ['empty','empty','empty','empty','lab','empty','empty','data','empty','empty'],
    ['empty','empty','empty','empty','empty','empty','workshop','empty','processor','empty'],
    ['empty','empty','lab','empty','data','empty','empty','empty','empty','empty'],
  ];

  // Runtime state (loaded from storage or defaults)
  let state;

  // Cached DOM elements
  const dom = {};

  /**
   * Load the saved game state from localStorage or fall back to
   * defaults. This also merges in any new properties that are
   * missing from older saves.
   */
  function loadGame() {
    try {
      const saved = localStorage.getItem('dataforgeTileSave');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default state
        state = Object.assign({}, defaultState, parsed);
        state.upgrades = Object.assign({}, defaultState.upgrades, parsed.upgrades || {});
        state.player = Object.assign({}, defaultState.player, parsed.player || {});
      } else {
        state = JSON.parse(JSON.stringify(defaultState));
      }
    } catch (err) {
      console.warn('Failed to load save', err);
      state = JSON.parse(JSON.stringify(defaultState));
    }
  }

  /**
   * Save the current state to localStorage. Called periodically
   * via an interval to prevent excessive writes.
   */
  function saveGame() {
    try {
      state.lastSaved = Date.now();
      localStorage.setItem('dataforgeTileSave', JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save game', err);
    }
  }

  /**
   * Compute the cost of purchasing the next level of a given
   * upgrade. Uses the exponential cost model defined in the
   * upgrade definitions.
   * @param {string} key Upgrade key
   * @returns {number} Rounded up cost
   */
  function getUpgradeCost(key) {
    const def = upgradeDefs[key];
    const level = state.upgrades[key] || 0;
    return Math.ceil(def.baseCost * Math.pow(def.costMultiplier, level));
  }

  /**
   * Calculate passive resource generation per tick (per second).
   * Data and compute generation scale with their respective
   * upgrades. XP passively accumulates a small amount per
   * training efficiency level.
   */
  function getPassiveRates() {
    const dataRate = (state.upgrades.webCrawler || 0) * (upgradeDefs.webCrawler.baseRate || 0);
    const computeRate = (state.upgrades.sensorArray || 0) * (upgradeDefs.sensorArray.baseRate || 0);
    const xpRate = (state.upgrades.trainingEfficiency || 0) * 0.2;
    return { data: dataRate, compute: computeRate, xp: xpRate };
  }

  /**
   * Draw the entire board. This constructs a grid of div
   * elements based on the mapLayout. Each tile is given a
   * class corresponding to its type. The player is rendered
   * inside the current tile. A click handler allows moving
   * to adjacent tiles.
   */
  function drawBoard() {
    const board = dom.board;
    board.innerHTML = '';
    for (let row = 0; row < mapLayout.length; row++) {
      for (let col = 0; col < mapLayout[row].length; col++) {
        const tileType = mapLayout[row][col];
        const tile = document.createElement('div');
        tile.className = `tile ${tileType}`;
        tile.dataset.row = row;
        tile.dataset.col = col;
        // If player is at this position, render the player element
        if (state.player.row === row && state.player.col === col) {
          const playerEl = document.createElement('div');
          playerEl.className = 'player';
          playerEl.textContent = '';
          tile.appendChild(playerEl);
        }
        tile.addEventListener('click', () => {
          attemptMove(row, col);
        });
        board.appendChild(tile);
      }
    }
  }

  /**
   * Attempt to move the player to the specified tile. Movement
   * is allowed only to orthogonally adjacent squares. After
   * moving, the board and actions panel are updated.
   * @param {number} row Target row
   * @param {number} col Target column
   */
  function attemptMove(row, col) {
    const dr = Math.abs(row - state.player.row);
    const dc = Math.abs(col - state.player.col);
    // Only allow one-step moves horizontally or vertically
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      state.player.row = row;
      state.player.col = col;
      drawBoard();
      updateActions();
    }
  }

  /**
   * Update the resource panel with current values. Called
   * whenever resources change.
   */
  function updateResourcePanel() {
    dom.rawDataCount.textContent = Math.floor(state.rawData);
    dom.computeCount.textContent = Math.floor(state.compute);
    dom.xpCount.textContent = Math.floor(state.xp);
    dom.levelCount.textContent = state.level;
  }

  /**
   * Determine the actions available at the player’s current
   * location and update the actions panel accordingly. This
   * function clears and repopulates the panel with buttons
   * relevant to the tile type. For a workshop tile the
   * upgrade list is displayed.
   */
  function updateActions() {
    const panel = dom.actions;
    panel.innerHTML = '';
    const type = mapLayout[state.player.row][state.player.col];
    // Display location name
    const title = document.createElement('h2');
    switch (type) {
      case 'data':
        title.textContent = 'Data Node';
        break;
      case 'processor':
        title.textContent = 'Processing Station';
        break;
      case 'lab':
        title.textContent = 'Research Lab';
        break;
      case 'workshop':
        title.textContent = 'Workshop';
        break;
      default:
        title.textContent = 'Empty Space';
    }
    panel.appendChild(title);
    // Container for buttons
    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';
    // Add buttons based on tile type
    if (type === 'data') {
      const gatherBtn = document.createElement('button');
      gatherBtn.textContent = 'Gather Data';
      gatherBtn.addEventListener('click', gatherData);
      btnGroup.appendChild(gatherBtn);
    }
    if (type === 'processor') {
      const processBtn = document.createElement('button');
      processBtn.textContent = 'Process Data';
      processBtn.disabled = state.rawData < 1;
      processBtn.addEventListener('click', processData);
      btnGroup.appendChild(processBtn);
    }
    if (type === 'lab') {
      const trainBtn = document.createElement('button');
      trainBtn.textContent = 'Run Training';
      trainBtn.disabled = state.compute < trainingDef.cost;
      trainBtn.addEventListener('click', runTraining);
      btnGroup.appendChild(trainBtn);
    }
    if (type === 'workshop') {
      // Show upgrade purchase list
      const shopTitle = document.createElement('div');
      shopTitle.textContent = 'Upgrades';
      shopTitle.style.marginTop = '0.5rem';
      panel.appendChild(btnGroup);
      panel.appendChild(shopTitle);
      const list = document.createElement('div');
      list.className = 'upgrade-list';
      Object.keys(upgradeDefs).forEach((key) => {
        const def = upgradeDefs[key];
        const level = state.upgrades[key] || 0;
        const cost = getUpgradeCost(key);
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        const info = document.createElement('div');
        info.className = 'upgrade-info';
        const nameEl = document.createElement('div');
        nameEl.className = 'upgrade-name';
        nameEl.textContent = def.name;
        const descEl = document.createElement('div');
        descEl.className = 'upgrade-desc';
        descEl.textContent = def.description;
        const levelEl = document.createElement('div');
        levelEl.className = 'upgrade-level';
        levelEl.textContent = `Level: ${level}`;
        const costEl = document.createElement('div');
        costEl.className = 'upgrade-cost';
        costEl.textContent = `Cost: ${cost} compute`;
        info.appendChild(nameEl);
        info.appendChild(descEl);
        info.appendChild(levelEl);
        info.appendChild(costEl);
        const btn = document.createElement('button');
        btn.textContent = 'Upgrade';
        btn.disabled = state.compute < cost;
        btn.addEventListener('click', () => {
          purchaseUpgrade(key);
        });
        item.appendChild(info);
        item.appendChild(btn);
        list.appendChild(item);
      });
      panel.appendChild(list);
      return; // workshop returns early because we already added btnGroup
    }
    panel.appendChild(btnGroup);
  }

  /**
   * Gather raw data from a data node. The amount collected is
   * 1 plus the rawDataBoost upgrade level. After gathering we
   * update resources and refresh the UI.
   */
  function gatherData() {
    const amount = 1 + (state.upgrades.rawDataBoost || 0);
    state.rawData += amount;
    updateResourcePanel();
    // On a data tile we might want to allow repeated gathering
    // without leaving the tile. Buttons remain.
  }

  /**
   * Process all available raw data into compute cycles. The
   * conversion factor is 1 plus the dataCompression level.
   */
  function processData() {
    if (state.rawData < 1) return;
    const factor = 1 + (state.upgrades.dataCompression || 0);
    const gain = state.rawData * factor;
    state.compute += gain;
    state.rawData = 0;
    updateResourcePanel();
    updateActions();
  }

  /**
   * Run a training run at the lab. Compute cycles are spent and
   * XP gained scales with the training efficiency upgrade. Level
   * up checks run after awarding XP.
   */
  function runTraining() {
    const cost = trainingDef.cost;
    if (state.compute < cost) return;
    state.compute -= cost;
    const efficiency = state.upgrades.trainingEfficiency || 0;
    const xpGain = trainingDef.baseXpGain * (1 + efficiency * 0.5);
    state.xp += xpGain;
    checkLevelUp();
    updateResourcePanel();
    updateActions();
  }

  /**
   * Purchase an upgrade if the player can afford it. Deducts
   * compute cycles and increments the upgrade level. UI updates
   * follow the purchase.
   * @param {string} key Upgrade identifier
   */
  function purchaseUpgrade(key) {
    const cost = getUpgradeCost(key);
    if (state.compute >= cost) {
      state.compute -= cost;
      state.upgrades[key] = (state.upgrades[key] || 0) + 1;
      updateResourcePanel();
      updateActions();
    }
  }

  /**
   * Check if the player has enough XP to level up. XP carries
   * over after levelling and the threshold increases by 25%.
   */
  function checkLevelUp() {
    let levelled = false;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level += 1;
      state.xpToNext = Math.ceil(state.xpToNext * 1.25);
      levelled = true;
    }
    if (levelled) {
      // Optionally display a notification; omitted for brevity
    }
  }

  /**
   * Apply passive generation once per tick. Data and compute
   * accumulate based on upgrades. XP accrues slowly if training
   * efficiency is increased. Level up logic runs afterwards.
   */
  function tick() {
    const rates = getPassiveRates();
    state.rawData += rates.data;
    state.compute += rates.compute;
    state.xp += rates.xp;
    checkLevelUp();
    updateResourcePanel();
    // Note: no actions update needed here
  }

  /**
   * Keyboard controls for movement. Arrow keys move the player
   * by one tile in the corresponding direction if within bounds.
   */
  function handleKeyDown(e) {
    const row = state.player.row;
    const col = state.player.col;
    let newRow = row;
    let newCol = col;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newRow = row - 1;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newRow = row + 1;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newCol = col - 1;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newCol = col + 1;
        break;
      default:
        return; // ignore other keys
    }
    // Prevent default scrolling behaviour
    e.preventDefault();
    // Ensure new position is within map bounds
    if (newRow >= 0 && newRow < mapLayout.length && newCol >= 0 && newCol < mapLayout[0].length) {
      state.player.row = newRow;
      state.player.col = newCol;
      drawBoard();
      updateActions();
    }
  }

  /**
   * Initialise the game. This caches DOM elements, loads saved
   * state, draws the board, sets up listeners and starts the
   * game loop and auto‑save timers.
   */
  function init() {
    // Cache DOM nodes
    dom.board = document.getElementById('game-board');
    dom.actions = document.getElementById('actions-panel');
    dom.rawDataCount = document.getElementById('rawDataCount');
    dom.computeCount = document.getElementById('computeCount');
    dom.xpCount = document.getElementById('xpCount');
    dom.levelCount = document.getElementById('levelCount');
    // Load state
    loadGame();
    // Initial draw and UI update
    drawBoard();
    updateResourcePanel();
    updateActions();
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    // Start loops
    setInterval(tick, 1000);
    setInterval(saveGame, 10000);
  }

  // Run init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
