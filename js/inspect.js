// inspect.js: the config screen for a device.
//
// Pressing E at a device opens it. It shows the device's real settings in
// boxes you can change, and pings to see what the device can reach.
// "Apply and re-test" copies the boxes back into the device and pings again;
// if that fixes the current job, the job closes. "Close" (or Esc) throws
// away anything you haven't applied.

let inspectedDevice = null;  // the device on screen right now (null = closed)

// The pings a technician would try: by name, by IP, and the internet.
// Trying the fileserver both ways shows whether DNS is the problem.
const PINGS = [
  { target: "fileserver",   label: "ping fileserver" },
  { target: "192.168.1.50", label: "ping 192.168.1.50" },
  { target: "internet",     label: "ping internet" },
];

// Shortcut: find an element on the page by its id.
function el(id) {
  return document.getElementById(id);
}

function isInspectOpen() {
  return inspectedDevice !== null;
}

// Show the config screen for one device.
function openInspect(device) {
  inspectedDevice = device;

  el("insp-name").textContent = device.name;
  el("insp-id").textContent = device.id;
  el("insp-owner").textContent = device.owner;

  // Only show the sections that make sense for this device.
  const isAP = device.type === "ap";
  el("inspect-panel").querySelector(".wifi-only").hidden = device.connection !== "wifi";
  el("inspect-panel").querySelector(".wired-only").hidden = device.connection !== "wired" || isAP;
  el("inspect-panel").querySelector(".ap-only").hidden = !isAP;
  el("inspect-panel").querySelector(".ip-only").hidden = isAP;

  // Fill the boxes in from the device's settings.
  if (device.wifi) {
    el("insp-wifi-on").checked = device.wifi.on;
    el("insp-ssid").value = device.wifi.ssid;
    el("insp-password").value = device.wifi.password;
  }
  if (device.cable) {
    el("insp-cable").checked = device.cable.plugged;
    el("insp-port").value = device.cable.switchPort;
  }
  if (isAP) {
    el("insp-ap-on").checked = device.on;
    el("insp-ssids").textContent = device.ssids.join(", ");
  } else {
    // "ip" is either the word "dhcp" or an address like "192.168.1.24".
    const isDhcp = device.ip === "dhcp";
    el("insp-ip-mode").value = isDhcp ? "dhcp" : "static";
    el("insp-ip").value = isDhcp ? "" : device.ip;
    el("insp-mask").value = device.mask;
    el("insp-gateway").value = device.gateway;
    el("insp-dns").value = device.dns;
    updateIpBox();
  }

  showPings(device, null);  // show what's working (and what isn't) right now
  hideHint();
  clearPresses();  // don't let the E that opened this count for anything else
  el("inspect-panel").hidden = false;
}

// Run every ping for this device and list the results on the screen.
// closedTicket is the job that was just fixed (or null), to show a message.
// "devices" is the list of every device, kept in main.js.
function showPings(device, closedTicket) {
  const results = el("insp-results");
  results.textContent = "";  // clear the old results

  // An access point isn't a computer, so it can't ping anything itself.
  if (device.type !== "ap") {
    for (const ping of PINGS) {
      const result = testConnection(device, ping.target, devices);
      const line = document.createElement("div");
      line.className = "ping-line " + (result.ok ? "ping-ok" : "ping-fail");
      line.textContent = (result.ok ? "✓ " : "✗ ") + ping.label + " · " + result.reason;
      results.appendChild(line);
    }
  }

  if (closedTicket) {
    const fixed = document.createElement("div");
    fixed.className = "ping-fixed";
    fixed.textContent = "Fixed! Job #" + closedTicket.id + " is closed."
      + (printerHasJobs() ? " The printer has your next job." : " That was the last job!");
    results.appendChild(fixed);
  }
}

// Hints: every ticket has one in tickets.json. It stays hidden until you
// ask, so you get the chance to work it out yourself first.
function showHint() {
  if (!currentTicket) return;  // no job, no hint
  el("insp-hint-text").textContent = "Hint for job #" + currentTicket.id + ": " + currentTicket.hint;
  el("insp-hint-text").hidden = false;
}

// Hide the hint, and only offer the Hint button while you have a job.
function hideHint() {
  el("insp-hint-text").hidden = true;
  el("insp-hint").hidden = !currentTicket;
}

// The Static IP box can only be typed in when "Static" is chosen.
function updateIpBox() {
  const isStatic = el("insp-ip-mode").value === "static";
  el("insp-ip").disabled = !isStatic;
  el("insp-ip").placeholder = isStatic ? "e.g. 192.168.1.30" : "(given out by DHCP)";
}

// "Apply and re-test": copy what's in the boxes back into the device, then
// ping again and check whether that fixed the current job. The screen
// stays open so you can see the results.
function applyAndRetest() {
  const device = inspectedDevice;
  if (!device) return;  // the screen isn't open, so there's nothing to save

  if (device.wifi) {
    device.wifi.on = el("insp-wifi-on").checked;
    device.wifi.ssid = el("insp-ssid").value;
    device.wifi.password = el("insp-password").value;
  }
  if (device.cable) {
    device.cable.plugged = el("insp-cable").checked;
    device.cable.switchPort = Number(el("insp-port").value);
  }
  if (device.type === "ap") {
    device.on = el("insp-ap-on").checked;
  } else {
    // trim() removes spaces typed by accident at the start or end.
    device.ip = el("insp-ip-mode").value === "dhcp" ? "dhcp" : el("insp-ip").value.trim();
    device.mask = el("insp-mask").value.trim();
    device.gateway = el("insp-gateway").value.trim();
    device.dns = el("insp-dns").value.trim();
  }

  console.log("Applied " + device.name + ":", device);

  // Fixing one device can fix the job's device (e.g. switching an access
  // point back on), so check the job whichever device you changed.
  const closedTicket = checkTicketFixed(devices);
  showPings(device, closedTicket);
  if (closedTicket) hideHint();  // the job's done, so no more hint button
}

function closeInspect() {
  inspectedDevice = null;
  el("inspect-panel").hidden = true;
  clearPresses();  // keys typed into the boxes shouldn't count as game keys
}

// Wire up the buttons and the IP mode dropdown.
el("insp-ip-mode").addEventListener("change", updateIpBox);
el("insp-cancel").addEventListener("click", closeInspect);
el("insp-hint").addEventListener("click", showHint);
// The form is "submitted" by the Save button or by pressing Enter in a box.
el("inspect-panel").addEventListener("submit", (event) => {
  event.preventDefault();  // stop the browser reloading the page
  applyAndRetest();
});
