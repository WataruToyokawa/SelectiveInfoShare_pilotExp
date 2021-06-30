"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var bezier_easing_1 = __importDefault(require("bezier-easing"));
var Hourglass = /** @class */ (function () {
    function Hourglass(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
    }
    Hourglass.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new Hourglass(scene, x, y, radius, color);
    };
    Object.defineProperty(Hourglass.prototype, "x", {
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
    Object.defineProperty(Hourglass.prototype, "y", {
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
    Hourglass.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    Hourglass.prototype.addToContainer = function (container, x, y) {
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
    Hourglass.prototype.make = function () {
        if (this.graphics) {
            this.graphics.destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        var radius = this.radius;
        var curve1 = new phaser_1.default.Curves.Path(0, 0);
        curve1.lineTo(-radius, 0);
        curve1.cubicBezierTo(new phaser_1.default.Math.Vector2(-radius, -radius * 0.5), new phaser_1.default.Math.Vector2(-radius * 0.5, -radius), new phaser_1.default.Math.Vector2(0, -radius));
        curve1.lineTo(0, 0);
        var curve2 = new phaser_1.default.Curves.Path(0, 0);
        curve2.lineTo(0, radius);
        curve2.cubicBezierTo(new phaser_1.default.Math.Vector2(radius * 0.5, radius), new phaser_1.default.Math.Vector2(radius, radius * 0.5), new phaser_1.default.Math.Vector2(radius, 0));
        curve2.lineTo(0, 0);
        var rotation = phaser_1.default.Math.DEG_TO_RAD * 45;
        this.graphics.fillStyle(this.color, 1);
        var points1 = curve1.getPoints().map(function (pt) { return pt.rotate(rotation); });
        this.graphics.fillPoints(points1);
        var points2 = curve2.getPoints().map(function (pt) { return pt.rotate(rotation); });
        this.graphics.fillPoints(points2);
        return this;
    };
    Hourglass.prototype.play = function (config) {
        if (config === void 0) { config = {}; }
        if (!this.graphics) {
            this.make();
        }
        if (this.timeline) {
            this.timeline.destroy();
        }
        var _a = config.loopDelay, loopDelay = _a === void 0 ? 0 : _a;
        this.timeline = this.scene.tweens.timeline({
            loop: -1,
            loopDelay: loopDelay
        });
        var duration = 600;
        this.timeline.add({
            targets: this.graphics,
            angle: 360,
            ease: bezier_easing_1.default(0.55, 0.055, 0.675, 0.19),
            duration: 500
        });
        this.timeline.add({
            targets: this.graphics,
            angle: 1440,
            duration: duration
        });
        this.timeline.add({
            targets: this.graphics,
            angle: 360,
            ease: bezier_easing_1.default(0.215, 0.61, 0.355, 1),
            duration: 500
        });
        this.timeline.play();
        return this;
    };
    return Hourglass;
}());
exports.default = Hourglass;
