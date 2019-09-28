// Overlay Plugin
// https://github.com/hibiyasleep/OverlayPlugin

// Zone Change
// Opcode 1
// Payload [ zoneID, zoneName, UUID ]

// Instance message
// Opcode 0
// Payload[0] "0039"
// Payload[2] "You are now in the instanced area Area Name InstanceSymbol."

interface OverlayPluginLogLine {
  opcode: number;
  timestamp: Date;
  payload: Array<String>;
}

function onLogLine(event: CustomEvent<OverlayPluginLogLine>) {

  if (event.detail.opcode === 1) {
    // Zone change
    document.getElementById("content").innerHTML = "";
    return;
  }

  if (event.detail.opcode !== 0) {
    return;
  }

  if (event.detail.payload[0] !== "0039") {
    return;
  }

  var match = event.detail.payload[2].match("You are now in the instanced area (.*?)(.)[.]");
  if (null === match) {
    return;
  }

  const instanceCharCode = match[2].charCodeAt(0)
  const instanceNumber = instanceCharCode - 57520;

  document.getElementById("content").innerHTML = "<span>" + instanceNumber + "</span>"
}

document.addEventListener("onLogLine", onLogLine);
