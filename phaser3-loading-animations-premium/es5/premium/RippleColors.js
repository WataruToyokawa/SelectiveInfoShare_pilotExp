"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Ripple_1 = __importDefault(require("./Ripple"));
var RippleColors = /** @class */ (function (_super) {
    __extends(RippleColors, _super);
    function RippleColors(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        var _this = _super.call(this, scene, x, y, radius, color) || this;
        _this.colors = [];
        _this.colorIndex = 0;
        _this.colors.push(color);
        return _this;
    }
    RippleColors.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new RippleColors(scene, x, y, radius, color);
    };
    RippleColors.prototype.useColor = function (color) {
        this.colors = [color];
        this.colorIndex = 0;
        return this;
    };
    RippleColors.prototype.useColors = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.colors = colors.slice();
        this.colorIndex = 0;
        return this;
    };
    RippleColors.prototype.make = function () {
        this.rings.forEach(function (ring) { return ring.destroy(); });
        this.rings.length = 0;
        var _a = this.position, x = _a.x, y = _a.y;
        var lineWidth = this.lineWidth;
        var scale = this.startingScale;
        for (var i = 0; i < this.ringCount; ++i) {
            var color = this.getColor();
            var ring = this.scene.add.circle(x, y, this.radius, color, 0)
                .setStrokeStyle(lineWidth / scale, color, 1)
                .setScale(scale)
                .setAlpha(0);
            this.rings.push(ring);
        }
        return this;
    };
    RippleColors.prototype.play = function () {
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
                    ring.setStrokeStyle(lineWidth / scale, _this.getColor(), 1);
                },
                delay: i * interval,
                duration: duration,
                repeat: -1
            });
        });
        return this;
    };
    RippleColors.prototype.getColor = function () {
        if (this.colorIndex > this.colors.length - 1) {
            this.colorIndex = 0;
        }
        var color = this.colors[this.colorIndex];
        ++this.colorIndex;
        return color;
    };
    return RippleColors;
}(Ripple_1.default));
exports.default = RippleColors;
