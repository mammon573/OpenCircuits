var DEFAULT_SIZE = require("../../../libraries/Constants").DEFAULT_SIZE;

var Gate = require("../Gate");

class Decoder extends Gate {
    constructor(context, x, y) {
        super(context, false, x, y, undefined);
    }
    onTransformChange() {
        this.transform.setSize(V(DEFAULT_SIZE, DEFAULT_SIZE));
        super.onTransformChange();
        this.transform.setSize(V(DEFAULT_SIZE, DEFAULT_SIZE/2*(2 << (this.inputs.length-1))));
    }
    setInputAmount(target) {
        target = Clamp(target, 0, 8);
        super.setInputAmount(target);
        super.setOutputAmount(2 << (target-1));
    }
    getInputAmount() {
        return this.inputs.length;
    }
    activate(x) {
        var num = 0;
        for (var i = 0; i < this.inputs.length; i++)
            num = num | ((this.inputs[i].isOn ? 1 : 0) << i);
        for (var i = 0; i < this.outputs.length; i++)
            this.outputs[i].activate(i === num, i);
    }
    draw() {
        super.draw();

        var renderer = this.context.getRenderer();
        this.localSpace();
        renderer.rect(0, 0, this.transform.size.x, this.transform.size.y, this.getCol(), this.getBorderColor());
        renderer.restore();
    }
    getMinInputFieldCount() {
        return 1;
    }
    getDisplayName() {
        return "Decoder";
    }
}
Decoder.getXMLName = function() { return "decoder"; }

module.exports = Decoder;

// Requirements
var V        = require("../../../libraries/math/Vector").V;
var Importer = require("../../../controllers/Importer");

var Clamp = require("../../../libraries/Utils").Clamp;
// 

Importer.types.push(Decoder);