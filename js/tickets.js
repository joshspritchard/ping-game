// tickets.js: the ticket printer, the job sheet pop-up, and the current job.
//
// Each ticket in data/tickets.json is one job: what's wrong, where, and
// which device. The printer hands them out one at a time, in order.

let tickets = [];          // every ticket from tickets.json
let currentTicket = null;  // the job you're working on (null = no job)
let nextTicketIndex = 0;   // which ticket the printer gives out next

async function loadTickets() {
  const response = await fetch("data/tickets.json");
  return await response.json();
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
    updateJobBar(devices);
  }
  showJobSheet(currentTicket, devices);
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
    jobText.textContent = "No job yet: visit the ticket printer";
    return;
  }
  const device = findDevice(devices, currentTicket.device);
  const deviceName = device ? device.name : currentTicket.device;
  jobText.textContent = "Job #" + currentTicket.id + " · " + deviceName + " · " + currentTicket.location;
}

// Clicking the button on the sheet closes it too.
document.getElementById("sheet-close").addEventListener("click", hideJobSheet);
