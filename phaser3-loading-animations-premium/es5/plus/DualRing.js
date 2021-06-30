"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var DualRing = /** @class */ (function () {
    function DualRing(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.lineWidth = 8;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.useColor(color);
        this.lineWidth = radius * 0.25;
    }
    DualRing.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new DualRing(scene, x, y, radius, color);
    };
    Object.defineProperty(DualRing.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (value) {
            var _a;
            this.position.x = value;
            (_a = this.graphics) === null || _a === void 0 ? void 0 : _a.setX(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DualRing.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (value) {
            var _a;
            this.position.y = value;
            (_a = this.graphics) === null || _a === void 0 ? void 0 : _a.setY(value);
        },
        enumerable: false,
        configurable: true
    });
    DualRing.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    DualRing.prototype.useLineWidth = function (width) {
        this.lineWidth = width;
        return this;
    };
    DualRing.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.graphics) {
            this.make();
        }
        container.add(this.graphics);
        if (x !== undefined) {
            this.x = x;
        }
        if (y !== undefined) {
            this.y = y;
        }
        return this;
    };
    DualRing.prototype.make = function () {
        if (this.graphics) {
            this.graphics.destroy();
        }
        var radius = this.radius - this.lineWidth * 0.5;
        var curve1 = new phaser_1.default.Curves.CubicBezier(new phaser_1.default.Math.Vector2(-radius, 0), new phaser_1.default.Math.Vector2(-radius, -radius * 0.5), new phaser_1.default.Math.Vector2(-radius * 0.5, -radius), new phaser_1.default.Math.Vector2(0, -radius));
        var curve2 = new phaser_1.default.Curves.CubicBezier(new phaser_1.default.Math.Vector2(radius, 0), new phaser_1.default.Math.Vector2(radius, radius * 0.5), new phaser_1.default.Math.Vector2(radius * 0.5, radius), new phaser_1.default.Math.Vector2(0, radius));
        this.graphics = this.scene.add.graphics({
            x: this.x, y: this.y
        });
        this.graphics.lineStyle(this.lineWidth, this.color, 1);
        curve1.draw(this.graphics);
        curve2.draw(this.graphics);
        return this;
    };
    DualRing.prototype.play = function (revolutionsPerSecond) {
        if (revolutionsPerSecond === void 0) { revolutionsPerSecond = 0.5; }
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
    return DualRing;
}());
exports.default = DualRing;
