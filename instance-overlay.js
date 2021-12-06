"use strict";
var InstanceOverlay;
(function (InstanceOverlay) {
    var LOG_PARSE_EVENT = 'onLogLine';
    var LINE_TYPE_INDEX = 0;
    var TIMESTAMP_INDEX = 1;
    var LINE_TYPE_LOGLINE = '00';
    var LOGLINE_CODE_INDEX = 2;
    var LOGLINE_LINE_INDEX = 4;
    var LINE_TYPE_CHANGEZONE = '01';
    var INSTANCE_MESSAGE_LOGLINE_CODE = '0039';
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
            typeof event.detail !== 'string') {
            console.log("Bad event object to onLogLine: " + event.detail);
            return;
        }
        var detail = JSON.parse(event.detail);
        if (!Array.isArray(detail) ||
            detail.length < LINE_TYPE_INDEX + 1) {
            console.log("Bad event object to onLogLine: " + event.detail);
            return;
        }
        var lineType = detail[LINE_TYPE_INDEX];
        if (LINE_TYPE_CHANGEZONE === lineType) {
            setInstance(0);
            return;
        }
        if (LINE_TYPE_LOGLINE !== lineType ||
            detail.length < LOGLINE_LINE_INDEX + 1 ||
            INSTANCE_MESSAGE_LOGLINE_CODE !== detail[LOGLINE_CODE_INDEX]) {
            return;
        }
        var logLineMessage = detail[LOGLINE_LINE_INDEX];
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