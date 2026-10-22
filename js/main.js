// main.js: the starting point of the game.
// For Issue #1 it just finds the canvas and draws a placeholder,
// so we know the page and canvas are wired up correctly.

// Find the canvas on the page, and get its "2d context":
// the object we use to draw shapes and text on it.
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Every tile in the world will be 32 x 32 pixels.
const TILE = 32;

// Fill the whole canvas with a dark grey background.
ctx.fillStyle = "#2b2a28";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Draw faint grid lines so we can see the 32px tiles.
ctx.strokeStyle = "#3a3936";
for (let x = 0; x <= canvas.width; x += TILE) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
}
for (let y = 0; y <= canvas.height; y += TILE) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
}

// Write a message in the middle of the canvas.
ctx.fillStyle = "#ecebe7";
ctx.font = "20px system-ui, sans-serif";
ctx.textAlign = "center";
ctx.fillText("The map will be drawn here (Issue #2)", canvas.width / 2, canvas.height / 2);
