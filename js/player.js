// player.js: where the player is, how they move, and drawing them.

// The player is a 24 x 24 pixel square (a bit smaller than a 32px tile,
// so they fit through doorways easily).
const PLAYER_SIZE = 24;

// How fast the player walks, in pixels per second (about 4 tiles a second).
const PLAYER_SPEED = 130;

// x and y are the player's top-left corner, in pixels from the map's top-left.
const player = { x: 0, y: 0 };

// Put the player in the middle of a tile.
function placePlayer(tileX, tileY) {
  player.x = tileX * TILE + (TILE - PLAYER_SIZE) / 2;
  player.y = tileY * TILE + (TILE - PLAYER_SIZE) / 2;
}

// Would the player's square fit at (x, y) without touching a wall?
// We check all four corners of the square. If any corner is in a wall,
// the player can't go there.
function canStandAt(map, x, y) {
  const right = x + PLAYER_SIZE - 1;
  const bottom = y + PLAYER_SIZE - 1;
  return (
    isWalkable(map, x, y) &&          // top-left corner
    isWalkable(map, right, y) &&      // top-right corner
    isWalkable(map, x, bottom) &&     // bottom-left corner
    isWalkable(map, right, bottom)    // bottom-right corner
  );
}

// Move the player based on the keys held down.
// dt is the time since the last frame, in seconds, so the player moves
// at the same speed on fast and slow computers.
function updatePlayer(map, dt) {
  // Work out the direction: -1, 0 or +1 on each axis.
  let dx = 0;
  let dy = 0;
  if (isDown("left")) dx -= 1;
  if (isDown("right")) dx += 1;
  if (isDown("up")) dy -= 1;
  if (isDown("down")) dy += 1;

  const step = PLAYER_SPEED * dt;

  // Move sideways first, then up/down, checking each one separately.
  // That way, if you walk diagonally into a wall, you slide along it
  // instead of getting stuck.
  if (dx !== 0) moveAxis(map, "x", dx * step);
  if (dy !== 0) moveAxis(map, "y", dy * step);
}

// Try to move the player "amount" pixels along one axis ("x" or "y").
// If the full move would hit a wall, creep forward 1 pixel at a time
// instead, so the player ends up right against the wall, not a gap away.
function moveAxis(map, axis, amount) {
  const tryMove = (distance) => {
    const x = axis === "x" ? player.x + distance : player.x;
    const y = axis === "y" ? player.y + distance : player.y;
    if (!canStandAt(map, x, y)) return false;
    player.x = x;
    player.y = y;
    return true;
  };

  if (tryMove(amount)) return;  // the whole move fits

  const direction = Math.sign(amount);  // +1 or -1
  // Line up to a whole pixel, then step 1 pixel at a time until blocked.
  player[axis] = direction > 0 ? Math.floor(player[axis]) : Math.ceil(player[axis]);
  for (let i = 0; i < Math.abs(amount); i++) {
    if (!tryMove(direction)) break;
  }
}

// Draw the player as a blue square with a darker outline.
function drawPlayer(ctx, map) {
  const offset = mapOffset(ctx.canvas, map);
  const px = Math.round(offset.x + player.x);
  const py = Math.round(offset.y + player.y);

  ctx.fillStyle = "#2a6fd6";
  ctx.fillRect(px, py, PLAYER_SIZE, PLAYER_SIZE);
  ctx.strokeStyle = "#123a75";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, PLAYER_SIZE - 2, PLAYER_SIZE - 2);
}
