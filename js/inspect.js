// inspect.js: the config screen for a device.
//
// Pressing E at a device opens it. It shows the device's real settings in
// boxes you can change. "Save changes" copies the boxes back into the
// device; "Close" (or Esc) throws your changes away.

let inspectedDevice = null;  // the device on screen right now (null = closed)

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

  clearPresses();  // don't let the E that opened this count for anything else
  el("inspect-panel").hidden = false;
}

// The Static IP box can only be typed in when "Static" is chosen.
function updateIpBox() {
  const isStatic = el("insp-ip-mode").value === "static";
  el("insp-ip").disabled = !isStatic;
  el("insp-ip").placeholder = isStatic ? "e.g. 192.168.1.30" : "(given out by DHCP)";
}

// Copy what's in the boxes back into the device.
function saveInspect() {
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

  console.log("Saved " + device.name + ":", device);
  closeInspect();
}

function closeInspect() {
  inspectedDevice = null;
  el("inspect-panel").hidden = true;
  clearPresses();  // keys typed into the boxes shouldn't count as game keys
}

// Wire up the buttons and the IP mode dropdown.
el("insp-ip-mode").addEventListener("change", updateIpBox);
el("insp-cancel").addEventListener("click", closeInspect);
// The form is "submitted" by the Save button or by pressing Enter in a box.
el("inspect-panel").addEventListener("submit", (event) => {
  event.preventDefault();  // stop the browser reloading the page
  saveInspect();
});
