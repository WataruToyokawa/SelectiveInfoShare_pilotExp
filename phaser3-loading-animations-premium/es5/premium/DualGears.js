"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var DualGears = /** @class */ (function () {
    function DualGears(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 32; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 32;
        this.gearColor1 = 0xffffff;
        this.gearColor2 = 0xffffff;
        this.gears = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.useColor(color);
    }
    DualGears.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 32; }
        if (color === void 0) { color = 0xffffff; }
        return new DualGears(scene, x, y, radius, color);
    };
    Object.defineProperty(DualGears.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (v) {
            this.position.x = v;
            this.layout();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DualGears.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (v) {
            this.position.y = v;
            this.layout();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DualGears.prototype, "lineWidth", {
        get: function () {
            return this.radius * 0.375;
        },
        enumerable: false,
        configurable: true
    });
    DualGears.prototype.useColor = function (color) {
        this.gearColor1 = color;
        this.gearColor2 = color;
        return this;
    };
    DualGears.prototype.useColors = function (color1, color2) {
        this.gearColor1 = color1;
        this.gearColor2 = color2 !== null && color2 !== void 0 ? color2 : color1;
        return this;
    };
    DualGears.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    DualGears.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.gears.length <= 0) {
            this.make();
        }
        this.gears.forEach(function (gear) {
            container.add(gear);
        });
        if (x !== undefined && y !== undefined) {
            this.setPosition(x, y);
        }
        else if (x !== undefined) {
            this.x = x;
        }
        else if (y !== undefined) {
            this.y = y;
        }
        return this;
    };
    DualGears.prototype.make = function () {
        while (this.gears.length > 0) {
            this.gears.pop().destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var halfLineWidth = this.lineWidth * 0.5;
        var radius = this.radius - halfLineWidth;
        var gear1 = this.createGear(x, y, radius, this.gearColor1);
        var gear2 = this.createGear(x, y, radius, this.gearColor2)
            .setAngle(22);
        this.gears.push(gear1, gear2);
        this.layout();
        return this;
    };
    DualGears.prototype.play = function () {
        var _a;
        if (this.gears.length <= 0) {
            this.make();
        }
        (_a = this.timeline) === null || _a === void 0 ? void 0 : _a.destroy();
        this.timeline = this.scene.tweens.timeline({
            loop: -1
        });
        for (var i = 0; i < this.gears.length; ++i) {
            var gear = this.gears[i];
            this.timeline.add({
                targets: gear,
                angle: gear.angle + (360 * (i % 2 === 0 ? 1 : -1)),
                duration: 3000,
                offset: 0
            });
        }
        this.timeline.play();
        return this;
    };
    DualGears.prototype.createGear = function (x, y, radius, color) {
        var halfLineWidth = this.lineWidth * 0.5;
        var graphics = this.scene.add.graphics({ x: x, y: y });
        graphics.lineStyle(this.lineWidth, color, 1);
        graphics.fillStyle(color, 1);
        graphics.strokeCircle(0, 0, radius);
        var len = radius + halfLineWidth;
        var vec = new phaser_1.default.Math.Vector2(1, 0);
        var rect = new phaser_1.default.Curves.Path(0, 0);
        rect.moveTo(-halfLineWidth, -halfLineWidth);
        rect.lineTo(halfLineWidth, -halfLineWidth);
        rect.lineTo(halfLineWidth, halfLineWidth);
        rect.lineTo(-halfLineWidth, halfLineWidth);
        rect.lineTo(-halfLineWidth, -halfLineWidth);
        var angle = 0;
        var _loop_1 = function (i) {
            var rotation = angle * phaser_1.default.Math.DEG_TO_RAD;
            vec.setToPolar(rotation, len);
            var points = rect.getPoints().map(function (pt) {
                pt.rotate(rotation);
                pt.x += vec.x;
                pt.y += vec.y;
                return pt;
            });
            graphics.fillPoints(points);
            angle += 45;
        };
        for (var i = 0; i < 8; ++i) {
            _loop_1(i);
        }
        return graphics;
    };
    DualGears.prototype.layout = function () {
        if (this.gears.length < 2) {
            return;
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var halfLineWidth = this.lineWidth * 0.5;
        var radius = this.radius - halfLineWidth;
        var distance = radius;
        var gear1 = this.gears[0];
        var gear2 = this.gears[1];
        gear1.x = x - distance;
        gear1.y = y - distance;
        gear2.x = x + distance;
        gear2.y = y + distance;
    };
    return DualGears;
}());
exports.default = DualGears;
