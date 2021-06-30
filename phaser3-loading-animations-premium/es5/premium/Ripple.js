"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Ripple = /** @class */ (function () {
    function Ripple(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.color = 0xffffff;
        this.lineWidth = 8;
        this.duration = 1000;
        this.ringCount = 2;
        this.startingScale = 0.01;
        this.rings = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.color = color;
        this.lineWidth = radius * 0.1;
    }
    Ripple.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new Ripple(scene, x, y, radius, color);
    };
    Object.defineProperty(Ripple.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (value) {
            this.position.x = value;
            this.rings.forEach(function (ring) {
                ring.x = value;
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Ripple.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (value) {
            this.position.y = value;
            this.rings.forEach(function (ring) {
                ring.y = value;
            });
        },
        enumerable: false,
        configurable: true
    });
    Ripple.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    Ripple.prototype.useDuration = function (duration) {
        this.duration = duration;
        return this;
    };
    Ripple.prototype.useRings = function (ringCount) {
        this.ringCount = ringCount;
        return this;
    };
    Ripple.prototype.addToContainer = function (container, x, y) {
        var _this = this;
        if (!container) {
            return this;
        }
        if (this.rings.length <= 0) {
            this.make();
        }
        this.rings.forEach(function (ring) {
            container.add(ring);
            if (x !== undefined) {
                _this.x = x;
            }
            if (y !== undefined) {
                _this.y = y;
            }
        });
        return this;
    };
    Ripple.prototype.make = function () {
        this.rings.forEach(function (ring) { return ring.destroy(); });
        this.rings.length = 0;
        var _a = this.position, x = _a.x, y = _a.y;
        var lineWidth = this.lineWidth;
        var scale = this.startingScale;
        for (var i = 0; i < this.ringCount; ++i) {
            var ring = this.scene.add.circle(x, y, this.radius, this.color, 0)
                .setStrokeStyle(lineWidth / scale, this.color, 1)
                .setScale(scale)
                .setAlpha(0);
            this.rings.push(ring);
        }
        return this;
    };
    Ripple.prototype.play = function () {
        var _this = this;
        if (this.rings.length <= 0) {
            this.make();
        }
        var lineWidth = this.lineWidth;
        var scale = this.startingScale;
        var duration = this.duration;
        var rings = this.ringCount;
        var interval = duration / rings;
        this.rings.forEach(function (ring, i) {
            _this.scene.add.tween({
                targets: ring,
                alpha: 0,
                scale: 1,
                onStart: function () {
                    ring.alpha = 1;
                },
                onUpdate: function (tween) {
                    var v = 1 - tween.getValue();
                    if (v <= 0) {
                        return;
                    }
                    ring.setStrokeStyle(lineWidth / v, ring.strokeColor, 1);
                },
                onRepeat: function () {
                    ring.alpha = 0;
                    ring.scale = scale;
                    ring.setStrokeStyle(lineWidth / scale, ring.strokeColor, 1);
                },
                delay: i * interval,
                duration: duration,
                repeat: -1
            });
        });
        return this;
    };
    return Ripple;
}());
exports.default = Ripple;
