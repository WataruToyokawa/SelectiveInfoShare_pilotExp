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
var phaser_1 = __importDefault(require("phaser"));
var CircleSpin_1 = __importDefault(require("./CircleSpin"));
var CircleSpinColors = /** @class */ (function (_super) {
    __extends(CircleSpinColors, _super);
    function CircleSpinColors(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        var _this = _super.call(this, scene, x, y, radius, color) || this;
        _this.colors = [];
        _this.colorIndex = 0;
        _this.colors.push(color);
        return _this;
    }
    CircleSpinColors.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new CircleSpinColors(scene, x, y, radius, color);
    };
    CircleSpinColors.prototype.useColor = function (color) {
        this.colors = [color];
        this.colorIndex = 0;
        return this;
    };
    CircleSpinColors.prototype.useColors = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.colors = colors.slice();
        this.colorIndex = 0;
        return this;
    };
    CircleSpinColors.prototype.make = function (config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        if (this.circle) {
            this.circle.destroy();
        }
        var color = this.getColor();
        this.circle = this.scene.add.circle(this.x, this.y, this.radius, color, 1);
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
                duration: duration,
                onComplete: function () {
                    _this.circle.setFillStyle(_this.getColor());
                }
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
                duration: duration,
                onComplete: function () {
                    _this.circle.setFillStyle(_this.getColor());
                }
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
    CircleSpinColors.prototype.getColor = function () {
        if (this.colorIndex > this.colors.length - 1) {
            this.colorIndex = 0;
        }
        var color = this.colors[this.colorIndex];
        ++this.colorIndex;
        return color;
    };
    return CircleSpinColors;
}(CircleSpin_1.default));
exports.default = CircleSpinColors;
