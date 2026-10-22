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

// The map the player is on right now.
let currentMap = null;

// When the last frame was drawn, so we can work out how much time passed.
let lastTime = 0;

// The game loop. The browser calls this about 60 times a second.
// "time" is how many milliseconds since the page loaded.
function gameLoop(time) {
  // Seconds since the last frame. Capped at 0.1 so the player doesn't jump
  // through walls if the tab was in the background for a while.
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  updatePlayer(currentMap, dt);   // 1. update: move the player
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
  let maps;
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

  const map = maps[START_MAP];
  if (!map) {
    showError('No map called "' + START_MAP + '" in maps.json');
    return;
  }

  // Show the map's name in the job bar.
  document.getElementById("location-text").textContent = map.name;

  currentMap = map;
  placePlayer(START_TILE.x, START_TILE.y);

  // Start the game loop.
  requestAnimationFrame((time) => {
    lastTime = time;
    gameLoop(time);
  });
}

start();
