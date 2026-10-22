// main.js: the starting point of the game.
// It loads the maps, puts the player in the IT Office, then runs the
// game loop: over and over, move the player and redraw the screen.

// Find the canvas on the page, and get its "2d context":
// the object we use to draw shapes and text on it.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// The player starts in the IT Office, just inside the door.
const START_MAP = "it-office";
const START_TILE = { x: 9, y: 12 };

// Every map from maps.json, and the one the player is on right now.
let maps = {};
let currentMap = null;

// Move the player to a map, standing on a given tile,
// and show the map's name in the job bar.
function goToMap(mapId, tileX, tileY) {
  currentMap = maps[mapId];
  placePlayer(tileX, tileY);
  document.getElementById("location-text").textContent = currentMap.name;
}

// If the middle of the player is standing on a door, go through it.
function checkDoors() {
  // Which tile is the centre of the player in?
  const tileX = Math.floor((player.x + PLAYER_SIZE / 2) / TILE);
  const tileY = Math.floor((player.y + PLAYER_SIZE / 2) / TILE);

  const door = findDoorAt(currentMap, tileX, tileY);
  if (!door) return;

  // A typo in "to" would crash the game, so check the map exists first.
  if (!maps[door.to]) {
    console.warn('Door leads to a map that does not exist: "' + door.to + '"');
    return;
  }

  // Spawn next to the door on the other side, not on it,
  // otherwise we'd go straight back through.
  goToMap(door.to, door.spawnX, door.spawnY);
}

// When the last frame was drawn, so we can work out how much time passed.
let lastTime = 0;

// The game loop. The browser calls this about 60 times a second.
// "time" is how many milliseconds since the page loaded.
function gameLoop(time) {
  // Seconds since the last frame. Capped at 0.1 so the player doesn't jump
  // through walls if the tab was in the background for a while.
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  updatePlayer(currentMap, dt);   // 1. update: move the player...
  checkDoors();                   //    ...and go through a door if on one
  drawMap(ctx, currentMap);       // 2. draw: the map first...
  drawPlayer(ctx, currentMap);    //    ...then the player on top

  // Ask the browser to call gameLoop again before the next screen refresh.
  requestAnimationFrame(gameLoop);
}

// If something goes wrong while starting, write the problem on the canvas
// instead of leaving a black screen.
// Pass in one or more lines of text; each is drawn on its own line.
function showError(...lines) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff8080";
  ctx.font = "16px system-ui, sans-serif";
  ctx.textAlign = "center";
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, canvas.height / 2 + i * 24);
  });
}

async function start() {
  // Wait for maps.json to load (loadMaps is in world.js).
  // "try" means: if anything in here fails, jump to "catch" instead of stopping.
  try {
    maps = await loadMaps();
  } catch (error) {
    console.error(error);
    showError(
      "Couldn't load data/maps.json.",
      "Open the game from a web server (http://...),",
      "not by double-clicking index.html."
    );
    return;
  }

  if (!maps[START_MAP]) {
    showError('No map called "' + START_MAP + '" in maps.json');
    return;
  }

  goToMap(START_MAP, START_TILE.x, START_TILE.y);

  // Start the game loop.
  requestAnimationFrame((time) => {
    lastTime = time;
    gameLoop(time);
  });
}

start();
