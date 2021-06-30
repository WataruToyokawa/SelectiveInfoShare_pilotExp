"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var CircleSpin = /** @class */ (function () {
    function CircleSpin(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    CircleSpin.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new CircleSpin(scene, x, y, radius, color);
    };
    Object.defineProperty(CircleSpin.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (value) {
            this.position.x = value;
            if (this.circle) {
                this.circle.x = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CircleSpin.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (value) {
            this.position.y = value;
            if (this.circle) {
                this.circle.y = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    CircleSpin.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    CircleSpin.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.circle || !this.timeline) {
            this.make();
        }
        container.add(this.circle);
        if (x !== undefined) {
            this.x = x;
        }
        if (y !== undefined) {
            this.y = y;
        }
        return this;
    };
    CircleSpin.prototype.make = function (config) {
        if (config === void 0) { config = {}; }
        if (this.circle) {
            this.circle.destroy();
        }
        this.circle = this.scene.add.circle(this.x, this.y, this.radius, this.color, 1);
        if (this.timeline) {
            this.timeline.destroy();
        }
        var _a = config.loopDelay, loopDelay = _a === void 0 ? 0 : _a, _b = config.spins, spins = _b === void 0 ? 10 : _b;
        this.timeline = this.scene.tweens.timeline({
            loop: -1,
            loopDelay: loopDelay
        });
        var fastSpins = Math.floor(spins * 0.8);
        var slowSpins = spins - fastSpins;
        var duration = 300;
        for (var i = 0; i < fastSpins; ++i) {
            this.timeline.add({
                targets: this.circle,
                scaleX: 0,
                ease: phaser_1.default.Math.Easing.Sine.InOut,
                duration: duration
            })
                .add({
                targets: this.circle,
                scaleX: 1,
                ease: phaser_1.default.Math.Easing.Sine.InOut,
                duration: duration
            });
            if (duration > 100) {
                duration *= 0.5;
            }
        }
        for (var i = 0; i < slowSpins; ++i) {
            duration *= 2;
            this.timeline.add({
                targets: this.circle,
                scaleX: 0,
                ease: phaser_1.default.Math.Easing.Sine.InOut,
                duration: duration
            })
                .add({
                targets: this.circle,
                scaleX: 1,
                ease: phaser_1.default.Math.Easing.Sine.InOut,
                duration: duration
            });
        }
        return this;
    };
    CircleSpin.prototype.play = function () {
        var _a;
        if (!this.circle || !this.timeline) {
            this.make();
        }
        (_a = this.timeline) === null || _a === void 0 ? void 0 : _a.play();
        return this;
    };
    return CircleSpin;
}());
exports.default = CircleSpin;
