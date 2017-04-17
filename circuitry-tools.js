class Tool {
    constructor() {
        this.isActive = false;
    }
    activate() {
        currentTool.deactivate();

        currentTool = this;
        this.isActive = true;
    }
    deactivate() {
        this.isActive = false;
    }
    onKeyDown(code) {
    }
    onKeyUp(code) {
    }
    onMouseMove() {
    }
    onMouseDown() {
    }
    onMouseUp() {
    }
    onClick() {
    }
}

class SelectionTool extends Tool {
    constructor() {
        super();
        this.isWirePressed = false;
        this.pressedWire = undefined;
        this.selection = undefined;
    }
    onKeyDown(code) {
        if (code === 18) { // Option key
            panTool.activate();
        }
    }
    onKeyUp(code) {
    }
    onMouseMove() {
        if (this.isWirePressed) {
            this.pressedWire.move(worldMousePos.x,worldMousePos.y);
            render();
        }
    }
    onMouseDown() {
        var pressed = false;
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].isPressable && objects[i].contains(worldMousePos)) {
                pressed = true;
                objects[i].press();
                render();
                break;
            }

            if (objects[i].oPortContains(worldMousePos) !== -1) {
                pressed = true;
                break;
            }
        }
        if (!pressed && !this.isWirePressed) {
            for (var i = 0; i < wires.length; i++) {
                var t;
                if ((t = wires[i].curve.getNearestT(worldMousePos.x,worldMousePos.y)) !== -1) {
                    this.isWirePressed = true;
                    this.pressedWire = wires[i];
                    console.log("press-arooney " + t);
                    wires[i].press(t);
                    render();
                    break;
                }
            }
        }
    }
    onMouseUp() {
        if (this.isWirePressed) {
            this.isWirePressed = false;
            this.pressedWire = undefined;
        }

        for (var i = 0; i < objects.length; i++) {
            if (objects[i].isPressable && objects[i].curPressed) {
                objects[i].release();
                render();
                break;
            }
        }
    }
    onClick() {
        var clicked = false;
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].sContains(worldMousePos)) {
                popup.select(objects[i]);
                this.selection = objects[i];
                clicked = true;
                render();
                break;
            }
            if (objects[i].isPressable && objects[i].contains(worldMousePos)) {
                objects[i].click();
                clicked = true;
                render();
                break;
            }

            var ii;
            if ((ii = objects[i].oPortContains(worldMousePos)) !== -1) {
                wiringTool.activate(objects[i], ii);
                render();
                break;
            }
        }

        if (!clicked) {
            popup.deselect();
            this.selection = null;
            render();
        }
    }
}

class PanTool extends Tool {
    onKeyUp(code) {
        if (code === 18) { // Option key
            selectionTool.activate();
        }
    }
    onMouseMove() {
        if (isDragging) {
            var pos = new Vector(mousePos.x, mousePos.y);
            var dPos = mouseDownPos.sub(pos);
            camera.pos.x += camera.zoom * dPos.x;
            camera.pos.y += camera.zoom * dPos.y;
            mouseDownPos = mousePos;

            popup.onMove();

            render();
        }
    }
}

class WiringTool extends Tool {
    constructor() {
        super();
        this.wire = undefined;
    }
    activate(object, index) {
        super.activate();
        this.wire = new Wire(object, object.connections.length);
        object.connect(this.wire, index);
    }
    deactivate() {
        super.deactivate();
        this.wire = undefined;
    }
    removeWire() {
        var j;
        for (var j = 0; j < wires.length && wires[j] !== this.wire; j++);
        wires.splice(j, 1);
        this.wire.inputs[0].disconnect(this.wire);
    }
    onMouseMove() {
        this.wire.curve.update(this.wire.curve.p1, worldMousePos, this.wire.curve.c1, worldMousePos);
        render();
    }
    onClick() {
        for (var i = 0; i < objects.length; i++) {
            var ii;
            if ((ii = objects[i].iPortContains(worldMousePos)) !== -1) {
                if (!this.wire.connect(objects[i], ii))
                    this.removeWire();

                selectionTool.activate();
                render();
                return;
            }
        }

        this.removeWire();
        selectionTool.activate();
        render();
    }
}

class ItemTool extends Tool {
    constructor() {
        super();
        this.item = undefined;
    }
    activate(object) {
        if (this.item !== undefined) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i] === this.item) {
                    objects.splice(i, 1);
                    break;
                }
            }
        }
        super.activate();
        this.item = object;
        objects.push(this.item);
        this.onMouseMove();
    }
    deactivate() {
        super.deactivate();
        this.item = undefined;
    }
    onMouseMove() {
        this.item.x = worldMousePos.x;
        this.item.y = worldMousePos.y;
        render();
    }
    onClick() {
        selectionTool.activate();
    }
}