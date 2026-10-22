// world.js: loading maps and drawing them on the canvas.
//
// A map is a grid of characters. Each character is one 32px tile:
//   #  wall
//   .  floor
//   D  door
//   P  ticket printer

// Every tile in the world is 32 x 32 pixels.
const TILE = 32;

// The colour to paint each kind of tile.
const TILE_COLOURS = {
  "#": "#3d4450", // wall: dark blue-grey
  ".": "#d9d4c7", // floor: light beige
  "D": "#8b5a2b", // door: brown
  "P": "#d9d4c7", // printer sits on floor; we draw the printer on top
};

// Load every map from data/maps.json.
// fetch() asks the web server for the file. It takes a moment, so it
// gives back a "promise", and "await" waits for the answer.
// This is why you need Live Server: fetch doesn't work on a file opened
// by double-clicking.
async function loadMaps() {
  const response = await fetch("data/maps.json");
  return await response.json();
}

// Work out where the top-left corner of a map goes, so that
// maps smaller than the canvas are drawn in the middle.
function mapOffset(canvas, map) {
  const mapWidth = map.grid[0].length * TILE;
  const mapHeight = map.grid.length * TILE;
  return {
    x: Math.floor((canvas.width - mapWidth) / 2),
    y: Math.floor((canvas.height - mapHeight) / 2),
  };
}

// Tiles you can't walk through.
const SOLID_TILES = ["#", "P"];

// Can the player stand on this point? x and y are in pixels, measured
// from the map's top-left corner (not the canvas's).
function isWalkable(map, x, y) {
  // Which tile is this pixel in? Divide by the tile size and round down.
  const tileX = Math.floor(x / TILE);
  const tileY = Math.floor(y / TILE);

  // Anything off the edge of the map counts as a wall.
  if (tileY < 0 || tileY >= map.grid.length) return false;
  const row = map.grid[tileY];
  if (tileX < 0 || tileX >= row.length) return false;

  return !SOLID_TILES.includes(row[tileX]);
}

// Draw one whole map.
function drawMap(ctx, map) {
  // Clear the canvas to black first (the area around small maps).
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const offset = mapOffset(ctx.canvas, map);

  // Go through every row (y), then every character in that row (x).
  for (let y = 0; y < map.grid.length; y++) {
    const row = map.grid[y];
    for (let x = 0; x < row.length; x++) {
      const tile = row[x];

      // Turn the tile's grid position into pixels on the canvas.
      const px = offset.x + x * TILE;
      const py = offset.y + y * TILE;

      // Paint the tile. Unknown characters show up bright pink so typos are easy to spot.
      ctx.fillStyle = TILE_COLOURS[tile] || "#ff00ff";
      ctx.fillRect(px, py, TILE, TILE);

      // The ticket printer: a dark box with a white "paper" slot.
      if (tile === "P") {
        ctx.fillStyle = "#2b2a28";
        ctx.fillRect(px + 4, py + 8, TILE - 8, TILE - 12);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(px + 9, py + 4, TILE - 18, 8);
      }
    }
  }
}
