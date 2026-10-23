// tickets.js: the ticket printer, the job sheet pop-up, and the current job.
//
// Each ticket in data/tickets.json is one job: what's wrong, where, and
// which device. The printer hands them out one at a time, in order.

let tickets = [];          // every ticket from tickets.json
let currentTicket = null;  // the job you're working on (null = no job)
let nextTicketIndex = 0;   // which ticket the printer gives out next
let lastClosedTicket = null;  // the job you fixed most recently

async function loadTickets() {
  return await loadJson("data/tickets.json");  // loadJson is in world.js
}

// Is the player next to a ticket printer ("P" tile) on this map?
// Returns the printer's tile { x, y }, or null if not.
function findNearbyPrinter(map) {
  const playerCentreX = player.x + PLAYER_SIZE / 2;
  const playerCentreY = player.y + PLAYER_SIZE / 2;

  for (let y = 0; y < map.grid.length; y++) {
    for (let x = 0; x < map.grid[y].length; x++) {
      if (map.grid[y][x] !== "P") continue;
      const distance = Math.hypot(x * TILE + TILE / 2 - playerCentreX,
                                  y * TILE + TILE / 2 - playerCentreY);
      if (distance <= REACH) return { x, y };
    }
  }
  return null;
}

// Pressing E at the printer. If you already have a job, show its sheet
// again (in case you forgot what it was). Otherwise print the next one.
function usePrinter(devices) {
  if (!currentTicket) {
    if (nextTicketIndex >= tickets.length) {
      console.log("The printer is out of jobs.");
      return;
    }
    currentTicket = tickets[nextTicketIndex];
    nextTicketIndex++;
    startTicket(currentTicket, devices);
    updateJobBar(devices);
  }
  showJobSheet(currentTicket, devices);
}

// Starting a job breaks the device, so there's something to fix.
// devices.json holds each device's WORKING settings. We make a copy of the
// device, break the copy, and swap the copy into the game. The original is
// kept safe, so later we can compare against it or put things back.
function startTicket(ticket, devices) {
  const index = devices.findIndex((device) => device.id === ticket.device);
  if (index === -1) {
    console.warn('Ticket #' + ticket.id + ' is for a device that does not exist: "' + ticket.device + '"');
    return;
  }

  // structuredClone makes a full copy, including the settings inside
  // "wifi", so changing the copy can't change the original.
  const broken = structuredClone(devices[index]);
  applyFault(broken, ticket.fault);
  devices[index] = broken;

  console.log("Ticket #" + ticket.id + " broke " + broken.name + ":", ticket.fault);
}

// Change the settings listed in a fault. Each key is a "path" to a setting,
// with dots between the levels, e.g. "wifi.ssid" means device.wifi.ssid.
//   applyFault(device, { "wifi.ssid": "GUEST-WIFI", "gateway": "" })
function applyFault(device, fault) {
  for (const path in fault) {
    const parts = path.split(".");          // "wifi.ssid" → ["wifi", "ssid"]
    const last = parts.pop();               // "ssid"; parts is now ["wifi"]

    // Walk down to the object that holds the setting (device.wifi).
    let target = device;
    for (const part of parts) {
      if (target[part] === undefined) target[part] = {};
      target = target[part];
    }

    target[last] = fault[path];             // device.wifi.ssid = "GUEST-WIFI"
  }
}

// Find a device by its id, e.g. "WB-R3-PC1" → Sarah's PC.
function findDevice(devices, id) {
  return devices.find((device) => device.id === id);
}

// Fill in the job sheet pop-up with a ticket's details, and show it.
function showJobSheet(ticket, devices) {
  const device = findDevice(devices, ticket.device);

  document.getElementById("sheet-number").textContent = "#" + ticket.id;
  document.getElementById("sheet-problem").textContent = ticket.problem;
  document.getElementById("sheet-location").textContent = ticket.location;
  document.getElementById("sheet-device").textContent = device ? device.name : ticket.device;
  document.getElementById("sheet-reported").textContent = ticket.reportedBy;

  document.getElementById("job-sheet").hidden = false;
}

function hideJobSheet() {
  document.getElementById("job-sheet").hidden = true;
}

function isJobSheetOpen() {
  return !document.getElementById("job-sheet").hidden;
}

// Show the current job in the job bar, so you remember it while you walk.
function updateJobBar(devices) {
  const jobText = document.getElementById("job-text");
  if (!currentTicket) {
    jobText.textContent = lastClosedTicket
      ? "Job #" + lastClosedTicket.id + " closed ✓ · visit the ticket printer"
      : "No job yet: visit the ticket printer";
    return;
  }
  const device = findDevice(devices, currentTicket.device);
  const deviceName = device ? device.name : currentTicket.device;
  jobText.textContent = "Job #" + currentTicket.id + " · " + deviceName + " · " + currentTicket.location;
}

// Is the current job fixed? Each ticket's "fixedWhen" says what must work
// again, e.g. { "canReach": "fileserver" } means the broken device must be
// able to reach the fileserver. If it's fixed, the job closes.
// Returns the ticket that was closed, or null if nothing closed.
function checkTicketFixed(devices) {
  if (!currentTicket) return null;

  const device = findDevice(devices, currentTicket.device);
  const result = testConnection(device, currentTicket.fixedWhen.canReach, devices);
  if (!result.ok) return null;

  // Fixed! Close the job, so the printer can hand out the next one.
  lastClosedTicket = currentTicket;
  currentTicket = null;
  updateJobBar(devices);
  console.log("Job #" + lastClosedTicket.id + " closed.");
  return lastClosedTicket;
}

// Are there any jobs left for the printer to hand out?
function printerHasJobs() {
  return nextTicketIndex < tickets.length;
}

// Clicking the button on the sheet closes it too.
document.getElementById("sheet-close").addEventListener("click", hideJobSheet);
