"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var GearSpin = /** @class */ (function () {
    function GearSpin(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.lineWidth = 24;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
    }
    GearSpin.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new GearSpin(scene, x, y, radius, color);
    };
    Object.defineProperty(GearSpin.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (v) {
            this.position.x = v;
            if (this.graphics) {
                this.graphics.x = v;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GearSpin.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (v) {
            this.position.y = v;
            if (this.graphics) {
                this.graphics.y = v;
            }
        },
        enumerable: false,
        configurable: true
    });
    GearSpin.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    GearSpin.prototype.useThickness = function (thickness) {
        this.lineWidth = thickness;
        return this;
    };
    GearSpin.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.graphics) {
            this.make();
        }
        if (this.graphics) {
            container.add(this.graphics);
        }
        if (x !== undefined) {
            this.x = x;
        }
        if (y !== undefined) {
            this.y = y;
        }
        return this;
    };
    GearSpin.prototype.make = function () {
        var _a;
        (_a = this.graphics) === null || _a === void 0 ? void 0 : _a.destroy();
        var _b = this.position, x = _b.x, y = _b.y;
        var halfLineWidth = this.lineWidth * 0.5;
        var radius = this.radius - this.lineWidth;
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        this.graphics.lineStyle(this.lineWidth, this.color, 1);
        this.graphics.fillStyle(this.color, 1);
        this.graphics.strokeCircle(0, 0, radius);
        var len = this.radius - halfLineWidth;
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
            this_1.graphics.fillPoints(points);
            angle += 45;
        };
        var this_1 = this;
        for (var i = 0; i < 8; ++i) {
            _loop_1(i);
        }
        return this;
    };
    GearSpin.prototype.play = function (revolutionsPerSecond) {
        if (revolutionsPerSecond === void 0) { revolutionsPerSecond = 0.25; }
        if (!this.graphics) {
            this.make();
        }
        if (this.scene.tweens.isTweening(this.graphics)) {
            this.scene.tweens.killTweensOf(this.graphics);
        }
        this.scene.add.tween({
            targets: this.graphics,
            angle: 360,
            repeat: -1,
            duration: 1000 / revolutionsPerSecond
        });
        return this;
    };
    return GearSpin;
}());
exports.default = GearSpin;
