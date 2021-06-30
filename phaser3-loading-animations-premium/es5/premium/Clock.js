"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickShape = exports.Ticks = void 0;
var phaser_1 = __importDefault(require("phaser"));
var Ticks;
(function (Ticks) {
    Ticks[Ticks["HOUR"] = 0] = "HOUR";
    Ticks[Ticks["QUARTER"] = 1] = "QUARTER";
    Ticks[Ticks["HALF"] = 2] = "HALF";
    Ticks[Ticks["TOP"] = 3] = "TOP";
    Ticks[Ticks["LEFT"] = 4] = "LEFT";
    Ticks[Ticks["BOTTOM"] = 5] = "BOTTOM";
    Ticks[Ticks["RIGHT"] = 6] = "RIGHT";
    Ticks[Ticks["NONE"] = 7] = "NONE";
})(Ticks = exports.Ticks || (exports.Ticks = {}));
var TickShape;
(function (TickShape) {
    TickShape[TickShape["CIRCLE"] = 0] = "CIRCLE";
    TickShape[TickShape["SQUARE"] = 1] = "SQUARE";
})(TickShape = exports.TickShape || (exports.TickShape = {}));
var Clock = /** @class */ (function () {
    function Clock(scene, x, y, radius, faceColor) {
        if (radius === void 0) { radius = 48; }
        if (faceColor === void 0) { faceColor = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 128;
        this.color = 0xffffff;
        this.hourHandColor = 0x000000;
        this.minuteHandColor = 0x000000;
        this.ticks = [];
        this.faceStroke = false;
        this.faceStrokeWidth = 8;
        this.faceStrokeColor = 0x000000;
        this.hour = 0;
        this.ticksType = Ticks.NONE;
        this.ticksShape = TickShape.CIRCLE;
        this.tickColor = 0xffffff;
        this.ticksRadius = 2;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = faceColor;
    }
    Clock.create = function (scene, x, y, radius, faceColor) {
        if (radius === void 0) { radius = 48; }
        if (faceColor === void 0) { faceColor = 0xffffff; }
        return new Clock(scene, x, y, radius, faceColor);
    };
    Object.defineProperty(Clock.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (v) {
            this.position.x = v;
            this.layout();
            this.layoutTicks();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Clock.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (v) {
            this.position.y = v;
            this.layout();
            this.layoutTicks();
        },
        enumerable: false,
        configurable: true
    });
    Clock.prototype.useFaceColor = function (color) {
        this.color = color;
        return this;
    };
    Clock.prototype.useHandColor = function (color) {
        this.hourHandColor = color;
        this.minuteHandColor = color;
        return this;
    };
    Clock.prototype.useHourHandColor = function (color) {
        this.hourHandColor = color;
        return this;
    };
    Clock.prototype.useMinuteHandColor = function (color) {
        this.minuteHandColor = color;
        return this;
    };
    Clock.prototype.useFaceStroke = function (lineWidth, color) {
        this.faceStroke = true;
        this.faceStrokeWidth = lineWidth;
        this.faceStrokeColor = color;
        return this;
    };
    Clock.prototype.useHourTicks = function (type, color, size, shape) {
        if (type === void 0) { type = Ticks.HOUR; }
        if (color === void 0) { color = 0xffffff; }
        if (size === void 0) { size = 4; }
        if (shape === void 0) { shape = TickShape.CIRCLE; }
        this.ticksType = type;
        this.tickColor = color;
        this.ticksRadius = size * 0.5;
        this.ticksShape = shape;
        return this;
    };
    Clock.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.face || !this.hourHand || !this.minuteHand) {
            this.make();
        }
        if (x !== undefined && y !== undefined) {
            this.position.x = x;
            this.position.y = y;
        }
        else if (x !== undefined) {
            this.position.x = x;
        }
        else if (y !== undefined) {
            this.position.y = y;
        }
        if (this.face) {
            container.add(this.face);
        }
        this.ticks.forEach(function (tick) {
            container.add(tick);
        });
        if (this.hourHand) {
            container.add(this.hourHand);
        }
        if (this.minuteHand) {
            container.add(this.minuteHand);
        }
        this.layout();
        this.layoutTicks();
        return this;
    };
    Clock.prototype.make = function () {
        if (this.face) {
            this.face.destroy();
        }
        if (this.minuteHand) {
            this.minuteHand.destroy();
        }
        if (this.hourHand) {
            this.hourHand.destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var hourHandWidth = this.radius * 0.75;
        var minuteHandWidth = this.radius * 0.85;
        this.face = this.scene.add.circle(x, y, this.radius, this.color, 1);
        if (this.faceStroke) {
            this.face.setStrokeStyle(this.faceStrokeWidth, this.faceStrokeColor, 1);
        }
        this.makeTicks();
        this.hourHand = this.scene.add.rectangle(x, y, hourHandWidth, 4, this.hourHandColor, 1)
            .setOrigin(0, 0.5);
        this.minuteHand = this.scene.add.rectangle(x, y, minuteHandWidth, 4, this.minuteHandColor, 1)
            .setOrigin(0, 0.5)
            .setAngle(-90);
        return this;
    };
    Clock.prototype.play = function (hourDuration) {
        var _this = this;
        if (hourDuration === void 0) { hourDuration = 1500; }
        if (!this.face || !this.hourHand || !this.minuteHand) {
            this.make();
        }
        this.scene.tweens.addCounter({
            from: 0,
            to: 360,
            duration: hourDuration,
            onUpdate: function (tween) {
                var v = tween.getValue();
                var diff = (v - 90) - _this.minuteHand.angle;
                _this.minuteHand.angle += diff;
                var p = Math.max(0, Math.min(1, v / 360));
                var currentStartAngle = _this.hour * 30;
                var hourDiff = p * 30;
                _this.hourHand.angle = currentStartAngle + hourDiff;
                if (p === 1) {
                    ++_this.hour;
                }
            },
            repeat: -1
        });
        return this;
    };
    Clock.prototype.getTickConfig = function (type) {
        var angle = 0;
        var count = 12;
        var interval = 30;
        switch (type) {
            case Ticks.HOUR:
                {
                    count = 12;
                    interval = 30;
                    break;
                }
            case Ticks.QUARTER:
                {
                    count = 4;
                    interval = 90;
                    break;
                }
            case Ticks.HALF:
                {
                    angle = -90;
                    count = 2;
                    interval = 180;
                    break;
                }
            case Ticks.TOP:
                {
                    angle = -90;
                    count = 1;
                    break;
                }
            case Ticks.BOTTOM:
                {
                    angle = 90;
                    count = 1;
                    break;
                }
            case Ticks.LEFT:
                {
                    angle = 180;
                    count = 1;
                    break;
                }
            case Ticks.RIGHT:
                {
                    angle = 0;
                    count = 1;
                    break;
                }
        }
        return {
            angle: angle,
            count: count,
            interval: interval
        };
    };
    Clock.prototype.makeTicks = function () {
        if (this.ticksType === Ticks.NONE) {
            return;
        }
        while (this.ticks.length > 0) {
            this.ticks.pop().destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var config = this.getTickConfig(this.ticksType);
        var count = config.count;
        for (var i = 0; i < count; ++i) {
            var tick = this.ticksShape === TickShape.CIRCLE
                ? this.scene.add.circle(x, y, this.ticksRadius, this.tickColor, 1)
                : this.scene.add.rectangle(x, y, this.ticksRadius * 2, this.ticksRadius * 2, this.tickColor, 1);
            this.ticks.push(tick);
        }
        this.layoutTicks();
    };
    Clock.prototype.layoutTicks = function () {
        var config = this.getTickConfig(this.ticksType);
        var interval = config.interval;
        var angle = config.angle;
        var len = this.radius * 0.8;
        var vec = new phaser_1.default.Math.Vector2();
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < this.ticks.length; ++i) {
            vec.setToPolar(phaser_1.default.Math.DEG_TO_RAD * angle, len);
            var tick = this.ticks[i];
            tick.x = x + vec.x;
            tick.y = y + vec.y;
            angle += interval;
        }
    };
    Clock.prototype.layout = function () {
        var _a = this.position, x = _a.x, y = _a.y;
        if (this.face) {
            this.face.x = x;
            this.face.y = y;
        }
        if (this.hourHand) {
            this.hourHand.x = x;
            this.hourHand.y = y;
        }
        if (this.minuteHand) {
            this.minuteHand.x = x;
            this.minuteHand.y = y;
        }
    };
    return Clock;
}());
exports.default = Clock;
