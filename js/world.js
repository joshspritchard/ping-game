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

// Load every device (PCs, laptops, access points...) from data/devices.json.
// It's a list, and each device says which map it's on and which tile.
async function loadDevices() {
  const response = await fetch("data/devices.json");
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

// Draw every device that's on this map, with its name underneath.
// mapId is the map's name in maps.json, e.g. "west-room3".
// nearby is the device the player is next to: we skip its label, because
// the player would cover it, and the prompt shows its name instead.
function drawDevices(ctx, map, mapId, devices, nearby) {
  const offset = mapOffset(ctx.canvas, map);

  // filter() keeps only the devices whose "map" matches the one we're on.
  const here = devices.filter((device) => device.map === mapId);

  for (const device of here) {
    const px = offset.x + device.x * TILE;
    const py = offset.y + device.y * TILE;
    drawDeviceIcon(ctx, device, px, py);
    if (device !== nearby) drawDeviceLabel(ctx, device, px, py);
  }
}

// Draw a simple picture of the device inside its tile, based on its type.
function drawDeviceIcon(ctx, device, px, py) {
  if (device.type === "pc") {
    // A monitor: dark frame, blue screen, little stand.
    ctx.fillStyle = "#222";
    ctx.fillRect(px + 6, py + 5, 20, 15);
    ctx.fillStyle = "#4da3ff";
    ctx.fillRect(px + 8, py + 7, 16, 11);
    ctx.fillStyle = "#222";
    ctx.fillRect(px + 14, py + 20, 4, 4);
    ctx.fillRect(px + 10, py + 24, 12, 2);
  } else if (device.type === "laptop") {
    // A laptop: screen on top, keyboard below.
    ctx.fillStyle = "#333";
    ctx.fillRect(px + 8, py + 8, 16, 11);
    ctx.fillStyle = "#4da3ff";
    ctx.fillRect(px + 10, py + 10, 12, 7);
    ctx.fillStyle = "#777";
    ctx.fillRect(px + 6, py + 19, 20, 5);
  } else if (device.type === "ap") {
    // An access point: a white disc with a light (green = on, red = off).
    ctx.fillStyle = "#f2f2f2";
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = device.on ? "#2ecc40" : "#e74c3c";
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // A type we don't have a picture for yet: a grey box with a "?".
    ctx.fillStyle = "#999";
    ctx.fillRect(px + 6, py + 6, 20, 20);
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", px + TILE / 2, py + TILE / 2);
  }
}

// Write the device's name, and how it connects, under its tile.
function drawDeviceLabel(ctx, device, px, py) {
  const connects = device.connection === "wifi" ? "Wi-Fi" : "Wired";
  drawTag(ctx, [device.name, connects], px + TILE / 2, py + TILE + 3);
}

// Show what you can use: a yellow outline around its tile, and a prompt
// along the bottom of the screen. target is { x, y, lines }, where x and y
// are the tile and lines is the text, e.g. ["E · Inspect Sarah's PC"].
function drawPrompt(ctx, map, target) {
  if (!target) return;  // not next to anything

  const offset = mapOffset(ctx.canvas, map);
  ctx.strokeStyle = "#ffd23f";
  ctx.lineWidth = 2;
  ctx.strokeRect(offset.x + target.x * TILE + 1, offset.y + target.y * TILE + 1, TILE - 2, TILE - 2);

  drawTag(ctx, target.lines, ctx.canvas.width / 2, ctx.canvas.height - 44);
}

// Fonts and colours for labels: line 1 is the main text, line 2 is smaller.
const TAG_FONTS = ["bold 13px system-ui, sans-serif", "12px system-ui, sans-serif"];
const TAG_COLOURS = ["#ffffff", "#9fcbff"];
const TAG_LINE_HEIGHT = 16;
const TAG_PADDING = 5;

// Draw one or more lines of text on a dark rounded box, so they're easy to
// read on any background. centreX is the middle of the box; top is its top edge.
function drawTag(ctx, lines, centreX, top) {
  // Measure the widest line, so the box fits the text.
  let width = 0;
  lines.forEach((line, i) => {
    ctx.font = TAG_FONTS[i];
    width = Math.max(width, ctx.measureText(line).width);
  });
  const boxWidth = width + TAG_PADDING * 2;
  const boxHeight = lines.length * TAG_LINE_HEIGHT + TAG_PADDING;

  // The box: nearly black, slightly see-through.
  ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
  ctx.beginPath();
  ctx.roundRect(centreX - boxWidth / 2, top, boxWidth, boxHeight, 4);
  ctx.fill();

  // The text, one line under the other.
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.font = TAG_FONTS[i];
    ctx.fillStyle = TAG_COLOURS[i];
    ctx.fillText(line, centreX, top + TAG_PADDING / 2 + 1 + i * TAG_LINE_HEIGHT);
  });
}

// Draw the map's name signs (building names, door signs).
// Each label's x and y are in tiles, and the text is centred on that tile.
function drawLabels(ctx, map, offset) {
  if (!map.labels) return;  // not every map has labels

  for (const label of map.labels) {
    const px = offset.x + label.x * TILE + TILE / 2;
    const py = offset.y + label.y * TILE + TILE / 2;
    // A one-line tag, centred on the tile (it's about 21px tall).
    drawTag(ctx, [label.text], px, py - 10);
  }
}
