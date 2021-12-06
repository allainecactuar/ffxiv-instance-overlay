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

namespace InstanceOverlay {
  const LOG_PARSE_EVENT = 'onLogLine';

  // Event Data always has [type, timestampt, ...]
  const LINE_TYPE_INDEX = 0;
  const TIMESTAMP_INDEX = 1;

  const LINE_TYPE_LOGLINE = '00'; // Event Data: [type, timestamp, code, name, line]
  const LOGLINE_CODE_INDEX = 2;
  const LOGLINE_LINE_INDEX = 4;

  const LINE_TYPE_CHANGEZONE = '01'; // Event Data: [type, timestamp, id, name]

  const INSTANCE_MESSAGE_LOGLINE_CODE = '0039';
  // Sample Event Data:
  // ["00","2021-12-06T10:37:13.0000000-08:00","0039","","You are now in the instanced area Garlemald . Current instance can be confirmed at any time using the /instance text command.","fb990aa147cb1367"]
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

  function onLogLine(event: CustomEvent<string>) {
    if ( typeof event !== 'object' ||
         typeof event.detail !== 'string' ) {
      console.log(`Bad event object to onLogLine: ${event.detail}`);
      return
    }

    let detail = JSON.parse(event.detail);
    if ( !Array.isArray(detail) ||
         detail.length < LINE_TYPE_INDEX + 1 ) {
      console.log(`Bad event object to onLogLine: ${event.detail}`);
      return
    }

    let lineType = detail[LINE_TYPE_INDEX];

    // ChangeZone events are always fired before the instance message,
    // and there are no instance messages at all for zones without
    // instances. So always clear the instance number on ChangeZone.
    if (LINE_TYPE_CHANGEZONE === lineType) {
      setInstance(0);
      return;
    }

    if (
      LINE_TYPE_LOGLINE !== lineType ||
      detail.length < LOGLINE_LINE_INDEX + 1 ||
      INSTANCE_MESSAGE_LOGLINE_CODE !== detail[LOGLINE_CODE_INDEX]
    ) {
      return;
    }

    const logLineMessage = detail[LOGLINE_LINE_INDEX];
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
