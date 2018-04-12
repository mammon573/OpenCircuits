var LEFT_MOUSE_BUTTON = require("../libraries/Constants").LEFT_MOUSE_BUTTON;
var SHIFT_KEY         = require("../libraries/Constants").SHIFT_KEY;
var CONTROL_KEY       = require("../libraries/Constants").CONTROL_KEY;
var COMMAND_KEY       = require("../libraries/Constants").COMMAND_KEY;
var OPTION_KEY        = require("../libraries/Constants").OPTION_KEY;
var ENTER_KEY         = require("../libraries/Constants").ENTER_KEY;
var Browser           = require("../libraries/Utils").GetBrowser();

var Vector              = require("../libraries/math/Vector");
var V                   = require("../libraries/math/Vector").V;

var Input = (function () {
    var rawMousePos   = new Vector(0,0);
    var mousePos      = new Vector(0,0);
    var prevMousePos  = new Vector(0,0);
    var worldMousePos = new Vector(0,0);

    var mouseDown = false;
    var mouseDownPos = undefined;
    
    var mouseListeners = [];

    var z = 0;

    var shiftKeyDown = false;
    var modifierKeyDown = false;
    var optionKeyDown = false;

    var isDragging = false;
    var startTapTime = undefined;
    
    console.log(shiftKeyDown);
    
    var onKeyDown = function(e) {
        var code = e.keyCode;
        
        console.log(shiftKeyDown);
        
        switch (code) {
            case SHIFT_KEY:
                shiftKeyDown = true;
                break;
            case CONTROL_KEY:
            case COMMAND_KEY:
                modifierKeyDown = true;
                break;
            case OPTION_KEY:
                optionKeyDown = true;
                getCurrentContext().setCursor("pointer");
                break;
            case ENTER_KEY:
                if (document.activeElement !== document.body)
                    document.activeElement.blur();
                break;
        }

        var objects = getCurrentContext().getObjects();
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] instanceof Keyboard)
                objects[i].onKeyDown(code);
        }

        getCurrentContext().getHistoryManager().onKeyDown(code);
        if (getCurrentTool().onKeyDown(code))
            render();
    }
    var onKeyUp = function(e) {
        var code = e.keyCode;

        switch (code) {
            case SHIFT_KEY:
                shiftKeyDown = false;
                break;
            case CONTROL_KEY:
            case COMMAND_KEY:
                modifierKeyDown = false;
                break;
            case OPTION_KEY:
                optionKeyDown = false;
                getCurrentContext().setCursor("default");
                break;
        }

        var objects = getCurrentContext().getObjects();
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] instanceof Keyboard)
                objects[i].onKeyUp(code);
        }

        if (getCurrentTool().onKeyUp(code))
            render();
    }
    var onDoubleClick = function(e) {
    }
    var onWheel = function(e) {
        var camera = getCurrentContext().getCamera();
        var delta = -e.deltaY / 120.0;

        var factor = 0.95;
        if (delta < 0)
            factor = 1 / factor;

        var worldMousePos = camera.getWorldPos(mousePos);
        camera.zoomBy(factor);
        var newMousePos = camera.getScreenPos(worldMousePos);
        var dx = (mousePos.x - newMousePos.x) * camera.zoom;
        var dy = (mousePos.y - newMousePos.y) * camera.zoom;

        camera.translate(-dx, -dy);

        SelectionPopup.onWheel();

        render();
    }
    var onMouseDown = function(e) {
        var canvas = getCurrentContext().getRenderer().canvas;
        var rect = canvas.getBoundingClientRect();
        isDragging = false;
        startTapTime = Date.now();
        mouseDown = true;
        mouseDownPos = new Vector(e.clientX - rect.left, e.clientY - rect.top);

        if (e.button === LEFT_MOUSE_BUTTON) {
            var shouldRender = false;
            ContextMenu.hide();
            shouldRender = getCurrentTool().onMouseDown(shouldRender);
            for (var i = 0; i < mouseListeners.length; i++)
                shouldRender = mouseListeners[i].onMouseDown(shouldRender) || shouldRender;
            if (shouldRender)
                render();
        }
    }
    var onMouseMove = function(e) {
        var canvas = getCurrentContext().getRenderer().canvas;
        var camera = getCurrentContext().getCamera();
        var rect = canvas.getBoundingClientRect();

        prevMousePos.x = mousePos.x;
        prevMousePos.y = mousePos.y;

        rawMousePos   = new Vector(e.clientX, e.clientY);
        mousePos      = new Vector(e.clientX - rect.left, e.clientY - rect.top);
        worldMousePos = camera.getWorldPos(mousePos);

        isDragging = (mouseDown && (Date.now() - startTapTime > 50));

        var shouldRender = false;

        if (optionKeyDown && isDragging) {
            var pos = new Vector(mousePos.x, mousePos.y);
            var dPos = mouseDownPos.sub(pos);
            camera.translate(camera.zoom * dPos.x, camera.zoom * dPos.y);
            mouseDownPos = mousePos;

            SelectionPopup.onMove();
            shouldRender = true;
        }

        shouldRender = getCurrentTool().onMouseMove(shouldRender) || shouldRender;
        for (var i = 0; i < mouseListeners.length; i++)
            shouldRender = mouseListeners[i].onMouseMove(shouldRender) || shouldRender;
        if (shouldRender)
            render();
    }
    var onMouseUp = function(e) {
        mouseDown = false;

        var shouldRender = false;
        shouldRender = getCurrentTool().onMouseUp(shouldRender);
        for (var i = 0; i < mouseListeners.length; i++)
            shouldRender = mouseListeners[i].onMouseUp(shouldRender) || shouldRender;
        if (shouldRender)
            render();
    }
    var onClick = function(e) {
        var shouldRender = false;
        shouldRender = getCurrentTool().onClick(shouldRender);
        for (var i = 0; i < mouseListeners.length; i++)
            shouldRender = mouseListeners[i].onClick(shouldRender) || shouldRender;
        if (shouldRender)
            render();
    }
    
    window.addEventListener('keydown', e => {onKeyDown(e);}, false);
    window.addEventListener('keyup', e => {onKeyUp(e);}, false);
    
    return {
        registerContext: function(ctx) {
            var canvas = ctx.getRenderer().canvas;
            canvas.addEventListener('click',      e => onClick(e), false);
            canvas.addEventListener('dblclick',   e => onDoubleClick(e), false);
            // if (browser.name !== "Firefox")
                canvas.addEventListener('wheel',  e => onWheel(e), false);
            // else
            //     canvas.addEventListener('DOMMouseScroll', e => onWheel(e), false);
            canvas.addEventListener('mousedown',  e => onMouseDown(e), false);
            canvas.addEventListener('mouseup',    e => onMouseUp(e), false);
            canvas.addEventListener('mousemove',  e => onMouseMove(e), false);
            canvas.addEventListener('mouseenter', e => { if (PlaceItemController.drag) { onMouseMove(e); onClick(e); PlaceItemController.drag = false; }}, false);
            canvas.addEventListener("mouseleave", e => { if (mouseDown) { onMouseUp(e); onClick(e); } });

            canvas.addEventListener("contextmenu", function(e) {
                ContextMenu.show(e);
                e.preventDefault();
            });
        },
        addMouseListener: function(l) {
            mouseListeners.push(l);
        },
        getWorldMousePos() {
            return V(worldMousePos);
        },
        getRawMousePos() {
            return V(rawMousePos);
        },
        getShiftKeyDown() {
            return shiftKeyDown;
        },
        getModifierKeyDown() {
            return modifierKeyDown;
        },
        getOptionKeyDown() {
            return optionKeyDown;
        },
        isDragging() {
            return isDragging;
        }
    }
})();
module.exports = Input;

// Requirements
var Keyboard            = require("../models/ioobjects/inputs/Keyboard");
var ContextMenu         = require("./contextmenu/ContextMenu");
var SelectionPopup      = require("./selectionpopup/SelectionPopup");
var PlaceItemController = require("./PlaceItemController");

var getCurrentContext = require("../libraries/Context").getCurrentContext;
var getCurrentTool    = require("./tools/Tool").getCurrent;
var render            = require("../views/Renderer").render;
//