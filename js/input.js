// input.js: keeps track of the keyboard.
//
// The browser tells us when a key goes down ("keydown") and when it
// comes back up ("keyup"). We keep two records:
//   held:    keys being held down right now (for walking)
//   pressed: keys that were tapped since the game last checked
//            (for one-off actions like E, so holding E doesn't repeat)

const held = {};
const pressed = {};

// Which keys do what. Each action can have more than one key.
const KEY_BINDINGS = {
  up:       ["ArrowUp", "KeyW"],
  down:     ["ArrowDown", "KeyS"],
  left:     ["ArrowLeft", "KeyA"],
  right:    ["ArrowRight", "KeyD"],
  sprint:   ["ShiftLeft", "ShiftRight"],
  interact: ["KeyE"],
  close:    ["Escape", "Enter"],
  cancel:   ["Escape"],
  hint:     ["KeyH"],
};

// Is the player typing in a box (e.g. on the config screen)?
function isTyping(event) {
  const tag = event.target.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

window.addEventListener("keydown", (event) => {
  held[event.code] = true;
  // When you hold a key, the browser sends keydown again and again
  // ("repeat"). Only count the first one as a press.
  // Letters typed into a box are just typing, not game keys: typing "h"
  // in the password box mustn't open the hint.
  const typingALetter = isTyping(event) && event.code.startsWith("Key");
  if (!event.repeat && !typingALetter) pressed[event.code] = true;
  // Stop arrow keys from scrolling the page while you play,
  // but let them move the cursor when typing in a box.
  if (event.code.startsWith("Arrow") && !isTyping(event)) event.preventDefault();
});

window.addEventListener("keyup", (event) => {
  held[event.code] = false;
});

// If the window loses focus (e.g. you click another app), let go of every
// key, so the player doesn't keep walking on their own.
window.addEventListener("blur", () => {
  for (const code in held) held[code] = false;
});

// Is an action ("up", "down", "left", "right") being held?
function isDown(action) {
  return KEY_BINDINGS[action].some((code) => held[code]);
}

// Forget every key tap that hasn't been used yet.
function clearPresses() {
  for (const code in pressed) pressed[code] = false;
}

// Was an action's key tapped since we last asked? Asking "uses up" the
// press, so one tap of E only does one thing.
function wasPressed(action) {
  let result = false;
  for (const code of KEY_BINDINGS[action]) {
    if (pressed[code]) result = true;
    pressed[code] = false;
  }
  return result;
}
