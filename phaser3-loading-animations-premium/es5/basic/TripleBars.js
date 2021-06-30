"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var bezier_easing_1 = __importDefault(require("bezier-easing"));
var TripleBars = /** @class */ (function () {
    function TripleBars(scene, x, y, color) {
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.color = 0xffffff;
        this.barWidth = 30;
        this.barHeight = 70;
        this.gap = 10;
        this.bars = [];
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.color = color;
    }
    TripleBars.create = function (scene, x, y, color) {
        if (color === void 0) { color = 0xffffff; }
        return new TripleBars(scene, x, y, color);
    };
    Object.defineProperty(TripleBars.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (value) {
            this.position.x = value;
            this.layout();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TripleBars.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (value) {
            this.position.y = value;
            this.layout();
        },
        enumerable: false,
        configurable: true
    });
    TripleBars.prototype.useBarWidth = function (width) {
        this.barWidth = width;
        return this;
    };
    TripleBars.prototype.useBarHeight = function (height) {
        this.barHeight = height;
        return this;
    };
    TripleBars.prototype.useBarGap = function (gap) {
        this.gap = gap;
        return this;
    };
    TripleBars.prototype.useBarColor = function (color) {
        this.color = color;
        return this;
    };
    TripleBars.prototype.addToContainer = function (container, x, y) {
        var _this = this;
        if (!container) {
            return this;
        }
        if (!this.timeline) {
            this.make();
        }
        this.bars.forEach(function (bar) {
            container.add(bar);
            if (x !== undefined) {
                _this.x = x;
            }
            if (y !== undefined) {
                _this.y = y;
            }
        });
        return this;
    };
    TripleBars.prototype.make = function (config) {
        var _this = this;
        var _a, _b, _c;
        if (config === void 0) { config = {}; }
        this.bars.forEach(function (bar) { return bar.destroy(); });
        this.bars.length = 0;
        for (var i = 0; i < 3; ++i) {
            this.bars.push(this.scene.add.rectangle(0, 0, this.barWidth, this.barHeight, this.color));
        }
        this.layout();
        this.timeline = this.scene.tweens.timeline({ loop: -1, loopDelay: 400 });
        var _d = config.expand, expand = _d === void 0 ? {} : _d, _e = config.contract, contract = _e === void 0 ? {} : _e, _f = config.scaleY, scaleY = _f === void 0 ? 1.6 : _f;
        var duration1 = (_a = expand.duration) !== null && _a !== void 0 ? _a : 35;
        var holdDelay = (_b = expand.hold) !== null && _b !== void 0 ? _b : 120;
        var duration2 = (_c = contract.duration) !== null && _c !== void 0 ? _c : 450;
        var offset1 = 0;
        var offset2 = duration1;
        this.bars.forEach(function (bar, i) {
            _this.timeline.add({
                targets: bar,
                scaleY: scaleY,
                duration: duration1,
                ease: bezier_easing_1.default(0.0, 0.5, 0.5, 0.1),
                offset: offset1
            });
            _this.timeline.add({
                targets: bar,
                scaleY: 1,
                duration: duration2,
                ease: phaser_1.default.Math.Easing.Cubic.Out,
                offset: offset2
            });
            offset1 += duration1 + holdDelay;
            offset2 += duration1 + holdDelay;
        });
        return this;
    };
    TripleBars.prototype.play = function () {
        if (!this.timeline) {
            this.make();
        }
        this.timeline.play();
        return this;
    };
    TripleBars.prototype.layout = function () {
        if (this.bars.length < 3) {
            return;
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var left = this.bars[0];
        left.x = x - this.barWidth - this.gap;
        left.y = y;
        var middle = this.bars[1];
        middle.x = x;
        middle.y = y;
        var right = this.bars[2];
        right.x = x + this.barWidth + this.gap;
        right.y = y;
    };
    return TripleBars;
}());
exports.default = TripleBars;
