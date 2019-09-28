"use strict";
var InstanceOverlay;
(function (InstanceOverlay) {
    var LOG_PARSE_EVENT = 'onLogLine';
    var CHANGE_ZONE_OPCODE = 1;
    var LOG_LINE_OPCODE = 0;
    var INSTANCE_MESSAGE_ID = '0039';
    var INSTANCE_MESSAGE_PATTERN = /You are now in the instanced area (.*?)(.)[.]/;
    var INSTANCE_MESSAGE_AREA_NAME_INDEX = 1;
    var INSTANCE_MESSAGE_INSTANCE_SYMBOL_INDEX = 2;
    var INSTANCE_CODEPOINT_OFFSET = 0xe0b0;
    function setInstance(instance) {
        var el = document.getElementById('content');
        if (null === el) {
            return;
        }
        if (0 === instance) {
            el.innerHTML = '';
        }
        else {
            el.innerHTML = '<span>' + instance + '</span>';
        }
    }
    function onLogLine(event) {
        if (typeof event !== 'object' ||
            typeof event.detail !== 'object' ||
            !Array.isArray(event.detail.payload)) {
            console.log('Bad event object to onLogLine');
            return;
        }
        if (CHANGE_ZONE_OPCODE === event.detail.opcode) {
            setInstance(0);
            return;
        }
        if (LOG_LINE_OPCODE !== event.detail.opcode ||
            INSTANCE_MESSAGE_ID !== event.detail.payload[0]) {
            return;
        }
        var logLineMessage = event.detail.payload[2];
        var match = logLineMessage.match(INSTANCE_MESSAGE_PATTERN);
        if (null === match) {
            return;
        }
        var instanceSymbol = match[INSTANCE_MESSAGE_INSTANCE_SYMBOL_INDEX];
        var instanceCodepoint = instanceSymbol.charCodeAt(0);
        var instanceNumber = instanceCodepoint - INSTANCE_CODEPOINT_OFFSET;
        setInstance(instanceNumber);
    }
    document.addEventListener(LOG_PARSE_EVENT, onLogLine);
})(InstanceOverlay || (InstanceOverlay = {}));
//# sourceMappingURL=instance-overlay.js.map