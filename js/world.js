// world.js: loading maps and drawing them on the canvas.
//
// A map is a grid of characters. Each character is one 32px tile:
//   #  wall
//   .  floor (or a path, outside)
//   D  door you can walk through (listed in the map's "doors")
//   L  locked door (a room we haven't built yet)
//   P  ticket printer
//   d  desk
//   g  grass
//   B  outside wall of a building
//   c  car park

// Every tile in the world is 32 x 32 pixels.
const TILE = 32;

// The colour to paint each kind of tile.
const TILE_COLOURS = {
  "#": "#3d4450", // wall: dark blue-grey
  ".": "#d9d4c7", // floor: light beige
  "D": "#8b5a2b", // door: brown
  "L": "#4a3420", // locked door: dark brown
  "P": "#d9d4c7", // printer sits on floor; we draw the printer on top
  "d": "#a67c52", // desk: wood
  "g": "#7fae5a", // grass: green
  "B": "#9a8f80", // building: stone grey
  "c": "#5f6163", // car park: tarmac grey
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
const SOLID_TILES = ["#", "P", "L", "d", "B"];

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

// Is there a door at this tile? Returns the door, or undefined if not.
function findDoorAt(map, tileX, tileY) {
  return map.doors.find((door) => door.x === tileX && door.y === tileY);
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

      // Car park: a white line on the left of each space.
      if (tile === "c") {
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(px, py + 4, 2, TILE - 8);
      }
    }
  }

  drawLabels(ctx, map, offset);
}

// Draw the map's name signs (building names, door signs).
// Each label's x and y are in tiles, and the text is centred on that tile.
function drawLabels(ctx, map, offset) {
  if (!map.labels) return;  // not every map has labels

  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1f1e1c";
  ctx.fillStyle = "#ffffff";

  for (const label of map.labels) {
    const px = offset.x + label.x * TILE + TILE / 2;
    const py = offset.y + label.y * TILE + TILE / 2;
    // Dark outline first, then white text on top, so it's readable anywhere.
    ctx.strokeText(label.text, px, py);
    ctx.fillText(label.text, px, py);
  }
}
