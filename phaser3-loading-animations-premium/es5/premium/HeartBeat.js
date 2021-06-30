"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var bezier_easing_1 = __importDefault(require("bezier-easing"));
var HeartBeat = /** @class */ (function () {
    function HeartBeat(scene, x, y, color, width, height) {
        if (color === void 0) { color = 0xffffff; }
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 128; }
        this.position = { x: 0, y: 0 };
        this.width = 128;
        this.height = 128;
        this.color = 0xffffff;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    HeartBeat.create = function (scene, x, y, color, width, height) {
        if (color === void 0) { color = 0xffffff; }
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 128; }
        return new HeartBeat(scene, x, y, color, width, height);
    };
    Object.defineProperty(HeartBeat.prototype, "x", {
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
    Object.defineProperty(HeartBeat.prototype, "y", {
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
    HeartBeat.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    HeartBeat.prototype.useWidth = function (width) {
        this.width = width;
        return this;
    };
    HeartBeat.prototype.useHeight = function (height) {
        this.height = height;
        return this;
    };
    HeartBeat.prototype.addToContainer = function (container, x, y) {
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
    HeartBeat.prototype.make = function () {
        var _a = this.position, x = _a.x, y = _a.y;
        var halfWidth = this.width * 0.5;
        var halfHeight = this.height * 0.5;
        var halfLineWidth = 4;
        var curve = new phaser_1.default.Curves.Path();
        curve.moveTo(0, halfHeight);
        curve.splineTo([
            new phaser_1.default.Math.Vector2(-halfWidth, -halfHeight * 0.3),
            new phaser_1.default.Math.Vector2(-halfWidth * 0.5, -halfHeight),
            new phaser_1.default.Math.Vector2(0, -halfHeight * 0.55)
        ]);
        curve.moveTo(-halfLineWidth, -halfHeight * 0.55);
        curve.splineTo([
            new phaser_1.default.Math.Vector2(halfWidth * 0.5, -halfHeight),
            new phaser_1.default.Math.Vector2(halfWidth, -halfHeight * 0.3),
            new phaser_1.default.Math.Vector2(-halfLineWidth, halfHeight)
        ]);
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        this.graphics.fillStyle(this.color, 1);
        this.graphics.fillPoints(curve.getPoints());
        return this;
    };
    HeartBeat.prototype.play = function () {
        var _this = this;
        if (!this.graphics) {
            this.make();
        }
        if (this.timeline) {
            this.timeline.destroy();
        }
        this.timeline = this.scene.tweens.timeline({
            onStart: function () {
                _this.graphics.scale = 0.95;
            },
            loop: -1,
            loopDelay: 100
        });
        var ease = bezier_easing_1.default(0.215, 0.61, 0.355, 1);
        this.timeline.add({
            targets: this.graphics,
            scale: 1.2,
            duration: 100,
            ease: ease
        })
            .add({
            targets: this.graphics,
            scale: 0.85,
            duration: 300,
            ease: ease
        })
            .add({
            targets: this.graphics,
            scale: 1,
            duration: 200,
            ease: ease
        })
            .add({
            targets: this.graphics,
            scale: 0.95,
            duration: 100,
            ease: ease
        })
            .add({
            targets: this.graphics,
            scale: 0.9,
            duration: 200,
            ease: ease
        });
        this.timeline.play();
        return this;
    };
    return HeartBeat;
}());
exports.default = HeartBeat;
