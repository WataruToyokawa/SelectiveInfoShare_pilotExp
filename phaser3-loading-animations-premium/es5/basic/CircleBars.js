"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var CircleBars = /** @class */ (function () {
    function CircleBars(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.bars = [];
        this.tweens = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
    }
    CircleBars.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new CircleBars(scene, x, y, radius, color);
    };
    Object.defineProperty(CircleBars.prototype, "x", {
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
    Object.defineProperty(CircleBars.prototype, "y", {
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
    CircleBars.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    CircleBars.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    CircleBars.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.bars.length <= 0) {
            this.make();
        }
        this.bars.forEach(function (bar) {
            container.add(bar);
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
    CircleBars.prototype.make = function () {
        while (this.bars.length > 0) {
            this.bars.pop().destroy();
        }
        var height = this.radius * 0.5;
        var width = 10;
        var _a = this.position, x = _a.x, y = _a.y;
        var angle = -90;
        for (var i = 0; i < 12; ++i) {
            var bar = this.scene.add.rectangle(x, y, width, height, this.color, 1)
                .setAngle(angle)
                .setAlpha(0.2);
            this.bars.push(bar);
            angle += 30;
        }
        this.layout();
        return this;
    };
    CircleBars.prototype.play = function (config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        if (this.bars.length <= 0) {
            this.make();
        }
        while (this.tweens.length > 0) {
            this.tweens.pop().remove();
        }
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent.destroy();
        }
        var _a = config.alpha, alpha = _a === void 0 ? 0.2 : _a, _b = config.alphaDuration, alphaDuration = _b === void 0 ? 400 : _b, _c = config.spacing, spacing = _c === void 0 ? 70 : _c;
        var i = 0;
        this.timerEvent = this.scene.time.addEvent({
            delay: spacing,
            loop: true,
            callback: function () {
                if (i < _this.tweens.length) {
                    var tween = _this.tweens[i];
                    tween.restart();
                }
                else {
                    var bar_1 = _this.bars[i];
                    var tween = _this.scene.tweens.add({
                        targets: bar_1,
                        alpha: alpha,
                        duration: alphaDuration,
                        onStart: function () {
                            bar_1.alpha = 1;
                        }
                    });
                    _this.tweens.push(tween);
                }
                ++i;
                if (i >= _this.bars.length) {
                    i = 0;
                }
            }
        });
        return this;
    };
    CircleBars.prototype.layout = function () {
        var height = this.radius * 0.5;
        var _a = this.position, sx = _a.x, sy = _a.y;
        for (var i = 0; i < this.bars.length; ++i) {
            var bar = this.bars[i];
            var angle = bar.angle;
            var _b = phaser_1.default.Math.RotateAround({ x: sx, y: sy - (this.radius - (height * 0.5)) }, sx, sy, phaser_1.default.Math.DEG_TO_RAD * angle), x = _b.x, y = _b.y;
            bar.x = x;
            bar.y = y;
        }
    };
    return CircleBars;
}());
exports.default = CircleBars;
