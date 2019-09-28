// Implements an integration with Overlay Plugin[0], a Final Fantaxy
// XIV plugin for Advanced Combat Tracker.
//
// Overlay Plugin supports a couple different types of overlays, we
// are implementing a LogParseOverlay.
//
// I can't find any documentation, but we can figure out the interface
// by reading the code[1].
//
// Log Lines aren't particularly well documented either, but cactbot
// does have a good guide to the opcodes at least[2].
//
// From just capturing all log lines with a custom trigger in ACT and
// experimenting, we can see there's a ChangeZone event with opcode 1.
//
// Unfortunately, ChangeZone does not include the instance number,
// that only seems to show up in a LogLine with opcode 0. Cactbot
// discourages writing triggers against these, but it's all we've got.
// We can narrow things down by looking at the two-byte identifer that
// precedes the message. I can't find a document with a full set of
// these identifiers, but from experimentation the instance messages
// use 0039.
//
// Lots of system messages use 0039 including AFK, sanctuary, powerful
// mark, party membership, etc, so we'll need to match against the
// specific message we're looking for.
//
// The final complication is that the instance number is given using a
// custom in-game unicode character that renders as a filled hexagon
// with the number.
//
// The symbol for instance 1 is "", or "\uE0B1". Conveniently, the
// next two codepoints are used for instances 2 and 3.
//
// 0. https://github.com/hibiyasleep/OverlayPlugin
// 1. https://github.com/hibiyasleep/OverlayPlugin/blob/master/OverlayPlugin.Core/Overlays/LogParseLoglineReader.cs#L68
// 2. https://github.com/quisquous/cactbot/blob/master/docs/LogGuide.md

namespace InstanceOverlay
{
  const LOG_PARSE_EVENT = 'onLogLine';

  interface OverlayPluginLogLine {
    opcode: number;
    timestamp: Date;
    payload: string[];
  }

  // ChangeZone Payload [ zoneID, zoneName, UUID ]
  const CHANGE_ZONE_OPCODE = 1;

  // LogLine Payload [ messageID, ... ]
  const LOG_LINE_OPCODE = 0;

  const INSTANCE_MESSAGE_ID = '0039';
  // Payload [ "0039", Unused, "You are now in the instanced area {AreaName} {InstanceSymbol}." ]
  const INSTANCE_MESSAGE_PATTERN = /You are now in the instanced area (.*?)(.)[.]/;
  const INSTANCE_MESSAGE_AREA_NAME_INDEX = 1;
  const INSTANCE_MESSAGE_INSTANCE_SYMBOL_INDEX = 2;
  const INSTANCE_CODEPOINT_OFFSET = 0xe0b0;

  function setInstance(instance: number) {
    const el = document.getElementById('content');
    if (null === el) {
      return;
    }
    if (0 === instance) {
      el.innerHTML = '';
    } else {
      el.innerHTML = '<span>' + instance + '</span>';
    }
  }

  function onLogLine(event: CustomEvent<OverlayPluginLogLine>) {
    if (
      typeof event !== 'object' ||
      typeof event.detail !== 'object' ||
      !Array.isArray(event.detail.payload)
    ) {
      console.log('Bad event object to onLogLine');
      return;
    }

    // ChangeZone events are always fired before the instance message,
    // and there are no instance messages at all for zones without
    // instances. So always clear the instance number on ChangeZone.
    if (CHANGE_ZONE_OPCODE === event.detail.opcode) {
      setInstance(0);
      return;
    }

    if (
      LOG_LINE_OPCODE !== event.detail.opcode ||
      INSTANCE_MESSAGE_ID !== event.detail.payload[0]
    ) {
      return;
    }

    const logLineMessage = event.detail.payload[2];
    const match = logLineMessage.match(INSTANCE_MESSAGE_PATTERN);
    if (null === match) {
      return;
    }

    const instanceSymbol = match[INSTANCE_MESSAGE_INSTANCE_SYMBOL_INDEX];
    const instanceCodepoint = instanceSymbol.charCodeAt(0);
    const instanceNumber = instanceCodepoint - INSTANCE_CODEPOINT_OFFSET;

    setInstance(instanceNumber);
  }

  document.addEventListener(LOG_PARSE_EVENT, onLogLine as EventListener);
}
