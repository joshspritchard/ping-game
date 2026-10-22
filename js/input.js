// input.js: keeps track of which keys are held down right now.
//
// The browser tells us when a key goes down ("keydown") and when it
// comes back up ("keyup"). We remember each one in the "held" object,
// so the game loop can ask "is the left key down?" at any moment.

const held = {};

// Which keys count as which direction. Each direction has two keys:
// an arrow key and a WASD key.
const KEY_BINDINGS = {
  up:    ["ArrowUp", "KeyW"],
  down:  ["ArrowDown", "KeyS"],
  left:  ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
};

window.addEventListener("keydown", (event) => {
  held[event.code] = true;
  // Stop arrow keys from scrolling the page while you play.
  if (event.code.startsWith("Arrow")) event.preventDefault();
});

window.addEventListener("keyup", (event) => {
  held[event.code] = false;
});

// If the window loses focus (e.g. you click another app), let go of every
// key, so the player doesn't keep walking on their own.
window.addEventListener("blur", () => {
  for (const code in held) held[code] = false;
});

// Is a direction ("up", "down", "left", "right") being held?
function isDown(direction) {
  return KEY_BINDINGS[direction].some((code) => held[code]);
}
