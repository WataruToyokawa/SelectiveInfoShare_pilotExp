"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var bezier_easing_1 = __importDefault(require("bezier-easing"));
var RollerDots = /** @class */ (function () {
    function RollerDots(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.dotRadius = 5;
        this.color = 0xffffff;
        this.dots = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
    }
    RollerDots.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new RollerDots(scene, x, y, radius, color);
    };
    Object.defineProperty(RollerDots.prototype, "x", {
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
    Object.defineProperty(RollerDots.prototype, "y", {
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
    Object.defineProperty(RollerDots.prototype, "realRadius", {
        get: function () {
            return this.radius - this.dotRadius;
        },
        enumerable: false,
        configurable: true
    });
    RollerDots.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    RollerDots.prototype.useRadiusForDots = function (radius) {
        this.dotRadius = radius;
        return this;
    };
    RollerDots.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.dots.length <= 0) {
            this.make();
        }
        this.dots.forEach(function (_a) {
            var display = _a.display;
            container.add(display);
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
    RollerDots.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    RollerDots.prototype.make = function () {
        while (this.dots.length > 0) {
            this.dots.pop().display.destroy();
        }
        var angle = 45;
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < 8; ++i) {
            var dot = this.scene.add.circle(x, y, this.dotRadius, this.color, 1);
            this.dots.push({
                display: dot,
                angle: angle,
                startAngle: angle
            });
            angle += 13;
        }
        this.layout();
        return this;
    };
    /**
     *
     * @param duration Time in milliseconds for 1 animation loop
     * @param spacing Time in milliseconds that each dot waits before moving
     */
    RollerDots.prototype.play = function (duration, spacing) {
        var _this = this;
        if (duration === void 0) { duration = 1250; }
        if (spacing === void 0) { spacing = 25; }
        if (this.dots.length <= 0) {
            this.make();
        }
        if (this.timeline) {
            this.timeline.destroy();
        }
        this.timeline = this.scene.tweens.timeline({
            loop: -1,
            loopDelay: 100,
            onLoop: function () {
                _this.dots.forEach(function (dot) {
                    dot.angle = dot.startAngle;
                });
            }
        });
        var offset = 0;
        for (var i = this.dots.length - 1; i >= 0; --i) {
            var dot = this.dots[i];
            this.timeline.add({
                targets: dot,
                angle: dot.angle + 360,
                duration: duration,
                ease: bezier_easing_1.default(0.5, 0, 0.5, 1),
                onUpdate: function (tween, target) {
                    var v = tween.getValue();
                    var vec = new phaser_1.default.Math.Vector2(0, 0);
                    vec.setToPolar(phaser_1.default.Math.DEG_TO_RAD * v, _this.realRadius);
                    var _a = _this.position, sx = _a.x, sy = _a.y;
                    target.display.x = sx + vec.x;
                    target.display.y = sy + vec.y;
                },
                offset: offset
            });
            offset += spacing;
        }
        this.timeline.play();
        return this;
    };
    RollerDots.prototype.layout = function () {
        var vec = new phaser_1.default.Math.Vector2(0, 0);
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < this.dots.length; ++i) {
            var _b = this.dots[i], angle = _b.angle, display = _b.display;
            vec.setToPolar(phaser_1.default.Math.DEG_TO_RAD * angle, this.realRadius);
            display.x = x + vec.x;
            display.y = y + vec.y;
        }
    };
    return RollerDots;
}());
exports.default = RollerDots;
