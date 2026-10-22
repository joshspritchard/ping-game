// main.js: the starting point of the game.
// It loads the maps, then draws the map the player starts on.

// Find the canvas on the page, and get its "2d context":
// the object we use to draw shapes and text on it.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// The player starts in the IT Office.
const START_MAP = "it-office";

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

  drawMap(ctx, map);
}

start();
