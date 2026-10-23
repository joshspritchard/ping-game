// network.js: the rules the game uses to decide if a device can reach
// something on the network. Nothing here draws anything, so you can test it
// on its own in the browser console (F12), for example:
//
//   const sarah = devices.find(d => d.id === "WB-R3-PC1");
//   testConnection(sarah, "fileserver", devices)    // by name (needs DNS)
//   testConnection(sarah, "192.168.1.50", devices)  // by IP (skips DNS)
//   testConnection(sarah, "internet", devices)
//
// Each test answers { ok: true/false, reason: "...", steps: [...] }.
// "reason" says what went wrong (or that it worked), and "steps" lists every
// rule that was checked, in order.

// ---------------------------------------------------------------------------
// The office network: the "right answers" that devices are checked against.
// ---------------------------------------------------------------------------
const OFFICE = {
  network: "192.168.1.0",   // the company network...
  mask:    "255.255.255.0", // ...is every address from 192.168.1.0 to 192.168.1.255
  gateway: "192.168.1.1",   // the router, the way out to other networks
  dns:     "192.168.1.5",   // the server that turns names into IP addresses
};

// The Wi-Fi networks the access points broadcast. Guest Wi-Fi has no
// password and can only reach the internet, never company servers.
const WIFI_NETWORKS = {
  "CORP-WIFI":  { password: "Ping2026!", company: true },
  "GUEST-WIFI": { password: "",          company: false },
};

// Switch ports in the comms cupboard that are broken (nothing works on them).
const DEAD_PORTS = [12];

// Things a device might try to reach. "company" means it's only on the
// company network, so guest Wi-Fi can't see it.
const TARGETS = {
  router:     { ip: "192.168.1.1",  company: true },
  dns:        { ip: "192.168.1.5",  company: true },
  fileserver: { ip: "192.168.1.50", company: true },
  internet:   { ip: "8.8.8.8",      company: false },
};

// ---------------------------------------------------------------------------
// Helpers for IP addresses
// ---------------------------------------------------------------------------

// Is this text a proper IP address: four numbers from 0 to 255 with dots?
function isValidIp(text) {
  const parts = String(text).split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

// Turn "192.168.1.10" into one big number, so we can compare addresses.
// Each part is one "byte" (0 to 255): 192*256*256*256 + 168*256*256 + 1*256 + 10.
function ipToNumber(ip) {
  return ip.split(".").reduce((total, part) => total * 256 + Number(part), 0);
}

// Are two addresses on the same network, using this mask?
// The mask says which part of the address is the network: with
// 255.255.255.0, the first three numbers must match.
function sameSubnet(ipA, ipB, mask) {
  const m = ipToNumber(mask);
  // ">>> 0" keeps the answer a positive number after the "&" (AND).
  return ((ipToNumber(ipA) & m) >>> 0) === ((ipToNumber(ipB) & m) >>> 0);
}

// The IP a device actually has. With DHCP the network hands one out
// automatically, so we give it a made-up address that's always valid.
// (In this game DHCP only hands out the address: the mask, gateway and DNS
// are whatever is typed on the device.)
function actualIp(device, devices) {
  if (device.ip !== "dhcp") return device.ip;
  const index = devices.indexOf(device);
  return "192.168.1." + (100 + Math.max(index, 0));
}

// ---------------------------------------------------------------------------
// The main test
// ---------------------------------------------------------------------------

// Can "device" reach "target"? target is a name from TARGETS (like
// "fileserver"), or an IP address typed directly (like "192.168.1.50").
// devices is the list of every device, needed to find the room's access
// point and to spot two devices with the same IP.
function testConnection(device, target, devices) {
  const steps = [];   // every rule we check gets written down here

  // Record a passed rule and carry on.
  const pass = (check, detail) => steps.push({ check, ok: true, detail });
  // Record a failed rule and stop: the answer is "no", with this reason.
  const fail = (check, detail) => {
    steps.push({ check, ok: false, detail });
    return { ok: false, reason: detail, steps };
  };

  // Work out what we're trying to reach.
  const byName = TARGETS[target] !== undefined;
  const targetInfo = byName ? TARGETS[target] : { ip: target, company: true };
  if (!byName && !isValidIp(target)) {
    return fail("Target", '"' + target + '" is not a known name or a valid IP address.');
  }

  // ---- Rule 1: is it connected? ------------------------------------------
  if (device.connection === "wired") {
    if (!device.cable || !device.cable.plugged) {
      return fail("Connected", "The network cable is unplugged.");
    }
    if (DEAD_PORTS.includes(device.cable.switchPort)) {
      return fail("Connected", "Switch port " + device.cable.switchPort + " is dead, so the cable goes nowhere.");
    }
    pass("Connected", "Cable plugged into switch port " + device.cable.switchPort + ".");
  } else if (device.connection === "wifi") {
    const wifi = device.wifi;
    if (!wifi || !wifi.on) {
      return fail("Connected", "Wi-Fi is switched off.");
    }
    // There must be a working access point in the same room, broadcasting this network.
    const ap = devices.find((d) => d.type === "ap" && d.map === device.map && d.on && d.ssids.includes(wifi.ssid));
    if (!ap) {
      return fail("Connected", "No working access point in this room is broadcasting " + wifi.ssid + ".");
    }
    const network = WIFI_NETWORKS[wifi.ssid];
    if (!network) {
      return fail("Connected", 'There is no Wi-Fi network called "' + wifi.ssid + '".');
    }
    if (network.password !== "" && wifi.password !== network.password) {
      return fail("Connected", "Wrong Wi-Fi password for " + wifi.ssid + ", so it can't join.");
    }
    pass("Connected", "Joined " + wifi.ssid + ".");
  } else {
    return fail("Connected", "This device doesn't have a network connection.");
  }

  // ---- Rule 2: which network? --------------------------------------------
  const onCompanyNetwork = device.connection === "wired" || WIFI_NETWORKS[device.wifi.ssid].company;
  if (!onCompanyNetwork) {
    if (targetInfo.company) {
      return fail("Network", "It's on " + device.wifi.ssid + ", which only reaches the internet, not company servers.");
    }
    // Guest Wi-Fi gets the internet straight away; the company's IP rules don't apply.
    pass("Network", "On " + device.wifi.ssid + ", which can reach the internet.");
    return { ok: true, reason: "Reached " + target + " over guest Wi-Fi.", steps };
  }
  pass("Network", "On the company network.");

  // ---- Rule 3: does it have a valid IP? ----------------------------------
  const ip = actualIp(device, devices);
  if (device.ip !== "dhcp") {
    if (!isValidIp(ip)) {
      return fail("IP address", '"' + ip + '" is not a valid IP address.');
    }
    if (!sameSubnet(ip, OFFICE.network, OFFICE.mask)) {
      return fail("IP address", ip + " is not on the company network (192.168.1.x).");
    }
    const takenByServer = Object.values(TARGETS).some((t) => t.ip === ip);
    const takenByDevice = devices.some((d) => d !== device && d.ip === ip);
    if (takenByServer || takenByDevice) {
      return fail("IP address", "Another device already uses " + ip + ", so they clash and one drops off.");
    }
    pass("IP address", "Static IP " + ip + " is valid.");
  } else {
    pass("IP address", "DHCP gave it " + ip + ".");
  }
  if (!isValidIp(device.mask)) {
    return fail("IP address", 'The subnet mask "' + device.mask + '" is not valid.');
  }

  // ---- Rule 4: can it reach the target? -----------------------------------
  // Same subnet (by the device's own mask): it can talk to it directly.
  // Otherwise it has to go through the gateway (the router).
  const targetIp = targetInfo.ip;
  if (sameSubnet(ip, targetIp, device.mask)) {
    pass("Route", targetIp + " is on the same network, so it goes there directly.");
  } else if (!device.gateway) {
    return fail("Route", targetIp + " is on another network, and there's no default gateway to get there.");
  } else if (device.gateway !== OFFICE.gateway) {
    return fail("Route", "The gateway " + device.gateway + " is wrong; the router is " + OFFICE.gateway + ".");
  } else {
    pass("Route", targetIp + " is on another network, so it goes via the gateway " + device.gateway + ".");
  }

  // ---- Rule 5: by name? ---------------------------------------------------
  // Typing a name like "fileserver" needs DNS to turn it into an IP address.
  if (byName) {
    if (!device.dns) {
      return fail("DNS", "No DNS server is set, so it can't turn \"" + target + "\" into an IP address.");
    }
    if (device.dns !== OFFICE.dns) {
      return fail("DNS", "The DNS server " + device.dns + " is wrong; it should be " + OFFICE.dns + ".");
    }
    pass("DNS", '"' + target + '" is ' + targetIp + ".");
  }

  return { ok: true, reason: "Reached " + target + ".", steps };
}
