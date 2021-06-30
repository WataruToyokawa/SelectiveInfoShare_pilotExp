"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var Sunny = /** @class */ (function () {
    function Sunny(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.raySize = 20;
        this.raysCount = 12;
        this.rayColors = [0xffffff];
        this.rayColorIndex = 0;
        this.rayGap = 2;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
    }
    Sunny.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new Sunny(scene, x, y, radius, color);
    };
    Object.defineProperty(Sunny.prototype, "x", {
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
    Object.defineProperty(Sunny.prototype, "y", {
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
    Sunny.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    Sunny.prototype.useRayColor = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.rayColors = colors.slice();
        return this;
    };
    Sunny.prototype.useRaysCount = function (count) {
        this.raysCount = count;
        return this;
    };
    Sunny.prototype.useRaySize = function (size) {
        this.raySize = size;
        return this;
    };
    Sunny.prototype.useRayGap = function (gap) {
        this.rayGap = gap;
        return this;
    };
    Sunny.prototype.addToContainer = function (container, x, y) {
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
    Sunny.prototype.make = function () {
        var _a;
        (_a = this.graphics) === null || _a === void 0 ? void 0 : _a.destroy();
        var _b = this.position, x = _b.x, y = _b.y;
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        var radius = this.radius - this.raySize;
        this.graphics.fillStyle(this.color, 1);
        this.graphics.fillCircle(0, 0, radius);
        var angle = -90;
        var vec = new phaser_1.default.Math.Vector2(0, 0);
        var len = radius + this.raySize * 0.5 + this.rayGap;
        var interval = 360 / this.raysCount;
        for (var i = 0; i < this.raysCount; ++i) {
            vec.setToPolar(angle * phaser_1.default.Math.DEG_TO_RAD, len);
            this.graphics.fillStyle(this.getRayColor(), 1);
            this.createTriangle(this.graphics, vec.x, vec.y, 90 + angle);
            angle += interval;
        }
        return this;
    };
    Sunny.prototype.play = function (revolutionsPerSecond) {
        if (revolutionsPerSecond === void 0) { revolutionsPerSecond = 1; }
        if (!this.graphics) {
            this.make();
        }
        if (this.scene.tweens.isTweening(this.graphics)) {
            this.scene.tweens.killTweensOf(this.graphics);
        }
        this.scene.tweens.add({
            targets: this.graphics,
            angle: 360,
            repeat: -1,
            duration: 3000 / revolutionsPerSecond
        });
        return this;
    };
    Sunny.prototype.createTriangle = function (graphics, x, y, angle) {
        if (angle === void 0) { angle = 0; }
        var triangleWidth = this.raySize;
        var triangleHalfWidth = triangleWidth * 0.5;
        var triangleQuarterWidth = triangleHalfWidth;
        var triangleHeight = this.raySize;
        var triangleHalfHeight = triangleHeight * 0.5;
        var rotation = angle * phaser_1.default.Math.DEG_TO_RAD;
        var pt1 = new phaser_1.default.Math.Vector2(x + triangleQuarterWidth, y + triangleHalfHeight);
        phaser_1.default.Math.RotateAround(pt1, x, y, rotation);
        var pt2 = new phaser_1.default.Math.Vector2(x, y - triangleHalfHeight);
        phaser_1.default.Math.RotateAround(pt2, x, y, rotation);
        var pt3 = new phaser_1.default.Math.Vector2(x - triangleQuarterWidth, y + triangleHalfHeight);
        phaser_1.default.Math.RotateAround(pt3, x, y, rotation);
        graphics.fillTriangle(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y);
    };
    Sunny.prototype.getRayColor = function () {
        if (this.rayColorIndex > this.rayColors.length - 1) {
            this.rayColorIndex = 0;
        }
        var color = this.rayColors[this.rayColorIndex];
        ++this.rayColorIndex;
        return color;
    };
    return Sunny;
}());
exports.default = Sunny;
