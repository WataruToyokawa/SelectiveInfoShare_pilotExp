"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var CircleDots = /** @class */ (function () {
    function CircleDots(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.dotRadius = 6;
        this.color = 0xffffff;
        this.dots = [];
        this.tweens = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
    }
    CircleDots.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new CircleDots(scene, x, y, radius, color);
    };
    Object.defineProperty(CircleDots.prototype, "x", {
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
    Object.defineProperty(CircleDots.prototype, "y", {
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
    Object.defineProperty(CircleDots.prototype, "realRadius", {
        get: function () {
            return this.radius - this.dotRadius;
        },
        enumerable: false,
        configurable: true
    });
    CircleDots.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    CircleDots.prototype.useRadiusForDots = function (radius) {
        this.dotRadius = radius;
        return this;
    };
    CircleDots.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    CircleDots.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.dots.length <= 0) {
            this.make();
        }
        this.dots.forEach(function (dot) {
            container.add(dot);
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
    CircleDots.prototype.make = function () {
        while (this.dots.length > 0) {
            this.dots.pop().destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < 12; ++i) {
            var dot = this.scene.add.circle(x, y, this.dotRadius, this.color, 1);
            this.dots.push(dot);
        }
        this.layout();
        return this;
    };
    CircleDots.prototype.play = function (config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        if (this.dots.length <= 0) {
            this.make();
        }
        while (this.tweens.length > 0) {
            this.tweens.pop().remove();
        }
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent.destroy();
        }
        var _a = config.scale, scale = _a === void 0 ? 1.4 : _a, _b = config.scaleDuration, scaleDuration = _b === void 0 ? 300 : _b, _c = config.spacing, spacing = _c === void 0 ? scaleDuration / 3 : _c;
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
                    var dot = _this.dots[i];
                    var tween = _this.scene.tweens.add({
                        targets: dot,
                        scale: scale,
                        duration: scaleDuration,
                        yoyo: true,
                    });
                    _this.tweens.push(tween);
                }
                ++i;
                if (i >= _this.dots.length) {
                    i = 0;
                }
            }
        });
        return this;
    };
    CircleDots.prototype.layout = function () {
        var angle = 0;
        var vec = new phaser_1.default.Math.Vector2(0, 0);
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < this.dots.length; ++i) {
            vec.setToPolar(phaser_1.default.Math.DEG_TO_RAD * angle, this.realRadius);
            var dot = this.dots[i];
            dot.x = x + vec.x;
            dot.y = y + vec.y;
            angle += 30;
        }
    };
    return CircleDots;
}());
exports.default = CircleDots;
