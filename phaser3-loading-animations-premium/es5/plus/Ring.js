"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var bezier_easing_1 = __importDefault(require("bezier-easing"));
var clone = function (curve, angle) {
    if (angle === void 0) { angle = 0; }
    return new phaser_1.default.Curves.CubicBezier(curve.p0.clone().rotate(phaser_1.default.Math.DEG_TO_RAD * angle), curve.p1.clone().rotate(phaser_1.default.Math.DEG_TO_RAD * angle), curve.p2.clone().rotate(phaser_1.default.Math.DEG_TO_RAD * angle), curve.p3.clone().rotate(phaser_1.default.Math.DEG_TO_RAD * angle));
};
var Ring = /** @class */ (function () {
    function Ring(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.lineWidth = 8;
        this.color = 0xffffff;
        this.angle = 90;
        this.rotation = 0;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
        this.lineWidth = radius * 0.25;
    }
    Ring.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new Ring(scene, x, y, radius, color);
    };
    Object.defineProperty(Ring.prototype, "x", {
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
    Object.defineProperty(Ring.prototype, "y", {
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
    Ring.prototype.useLineWidth = function (width) {
        this.lineWidth = width;
        return this;
    };
    Ring.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    Ring.prototype.addToContainer = function (container, x, y) {
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
    Ring.prototype.make = function () {
        if (this.graphics) {
            this.graphics.destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var radius = this.radius;
        var c = 0.551915024494;
        var start = new phaser_1.default.Math.Vector2(-radius, 0);
        var c1 = new phaser_1.default.Math.Vector2(-radius, -radius * c);
        var c2 = new phaser_1.default.Math.Vector2(-radius * c, -radius);
        var end = new phaser_1.default.Math.Vector2(0, -radius);
        this.curve = new phaser_1.default.Curves.CubicBezier(start, c1, c2, end);
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        this.graphics.angle = 45;
        this.setAngle(90);
        return this;
    };
    Ring.prototype.play = function (duration) {
        var _this = this;
        if (duration === void 0) { duration = 700; }
        if (!this.graphics) {
            this.make();
        }
        if (this.timeline) {
            this.timeline.destroy();
        }
        var obj = { count: 90 };
        this.timeline = this.scene.tweens.timeline({
            loop: -1,
            onLoop: function () {
                _this.rotation = 0;
            }
        });
        this.timeline.add({
            targets: obj,
            count: 320,
            duration: duration,
            ease: bezier_easing_1.default(0.5, 0, 0.5, 1),
            onUpdate: function (tween) {
                var v = tween.getValue();
                _this.setAngle(v);
            }
        })
            .add({
            targets: obj,
            count: 90,
            duration: duration * 0.8,
            ease: bezier_easing_1.default(0.5, 0, 0.5, 1),
            onUpdate: function (tween) {
                var v = tween.getValue();
                _this.setAngleInverse(v);
            }
        })
            .add({
            targets: this,
            rotation: 130,
            duration: 1000,
            offset: duration * 0.4,
            ease: bezier_easing_1.default(0.5, 0, 0.5, 1)
        });
        this.timeline.play();
        return this;
    };
    Ring.prototype.setAngle = function (angle) {
        if (!this.graphics || !this.curve) {
            return;
        }
        if (angle < 90) {
            this.angle = 90;
        }
        else if (angle > 330) {
            this.angle = 330;
        }
        else {
            this.angle = angle;
        }
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, this.color, 1);
        if (this.angle <= 90) {
            var c1 = clone(this.curve, this.rotation);
            c1.draw(this.graphics);
        }
        else if (this.angle <= 170) {
            var c1 = clone(this.curve);
            c1.draw(this.graphics);
            var c2 = clone(this.curve, this.angle - 90 + this.rotation);
            c2.draw(this.graphics);
        }
        else if (this.angle <= 250) {
            var c1 = clone(this.curve, this.rotation);
            c1.draw(this.graphics);
            var c2 = clone(this.curve, 80 + this.rotation);
            c2.draw(this.graphics);
            var c3 = clone(this.curve, this.angle - 90 + this.rotation);
            c3.draw(this.graphics);
        }
        else if (this.angle <= 330) {
            var c1 = clone(this.curve, this.rotation);
            c1.draw(this.graphics);
            var c2 = clone(this.curve, 80 + this.rotation);
            c2.draw(this.graphics);
            var c3 = clone(this.curve, 160 + this.rotation);
            c3.draw(this.graphics);
            var c4 = clone(this.curve, this.angle - 90 + this.rotation);
            c4.draw(this.graphics);
        }
    };
    Ring.prototype.setAngleInverse = function (angle, max) {
        if (max === void 0) { max = 320; }
        if (!this.graphics || !this.curve) {
            return;
        }
        if (angle < 90) {
            this.angle = 90;
        }
        else if (angle > 330) {
            this.angle = 330;
        }
        else {
            this.angle = angle;
        }
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, this.color, 1);
        var inverseAngle = max - this.angle;
        if (inverseAngle <= 90) {
            var c1 = clone(this.curve, inverseAngle + this.rotation);
            c1.draw(this.graphics);
            var c2 = clone(this.curve, 80 + this.rotation);
            c2.draw(this.graphics);
            var c3 = clone(this.curve, 160 + this.rotation);
            c3.draw(this.graphics);
            var c4 = clone(this.curve, max - 90 + this.rotation);
            c4.draw(this.graphics);
        }
        else if (inverseAngle <= 170) {
            var c1 = clone(this.curve, inverseAngle + this.rotation);
            c1.draw(this.graphics);
            var c3 = clone(this.curve, 160 + this.rotation);
            c3.draw(this.graphics);
            var c4 = clone(this.curve, max - 90 + this.rotation);
            c4.draw(this.graphics);
        }
        else if (inverseAngle <= 250) {
            var c1 = clone(this.curve, inverseAngle + this.rotation);
            c1.draw(this.graphics);
            var c4 = clone(this.curve, max - 90 + this.rotation);
            c4.draw(this.graphics);
        }
        else if (inverseAngle <= 330) {
            var c1 = clone(this.curve, inverseAngle + this.rotation);
            c1.draw(this.graphics);
        }
    };
    return Ring;
}());
exports.default = Ring;
