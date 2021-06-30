"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var Ellipsis = /** @class */ (function () {
    function Ellipsis(scene, x, y, color) {
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.color = 0xffffff;
        this.dots = [];
        this.dotRadius = 12;
        this.gap = 16;
        this.cachedSpeedMultiplier = 1;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.color = color;
    }
    Ellipsis.create = function (scene, x, y, color) {
        if (color === void 0) { color = 0xffffff; }
        return new Ellipsis(scene, x, y, color);
    };
    Ellipsis.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    Ellipsis.prototype.useRadiusForDots = function (radius) {
        this.dotRadius = radius;
        return this;
    };
    Ellipsis.prototype.useGapForDots = function (gap) {
        this.gap = gap;
        return this;
    };
    Ellipsis.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        this.reconstructTimeline();
        return this;
    };
    Ellipsis.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.dots.length <= 0) {
            this.make();
        }
        this.dots.forEach(function (dot) {
            container.add(dot);
        });
        var last = this.dots[this.dots.length - 1];
        container.moveDown(last);
        if (x !== undefined && y !== undefined) {
            this.setPosition(x, y);
        }
        else if (x !== undefined) {
            this.position.x = x;
            this.layout();
            this.reconstructTimeline();
        }
        else if (y !== undefined) {
            this.position.y = y;
            this.layout();
            this.reconstructTimeline();
        }
        return this;
    };
    Ellipsis.prototype.make = function () {
        while (this.dots.length > 0) {
            this.dots.pop().destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < 4; ++i) {
            var dot = this.scene.add.circle(x, y, this.dotRadius, this.color);
            this.dots.push(dot);
        }
        this.dots[0].setScale(0);
        var last = this.dots[this.dots.length - 1];
        this.scene.children.moveDown(last);
        this.layout();
        return this;
    };
    Ellipsis.prototype.play = function (speedMultiplier) {
        if (speedMultiplier === void 0) { speedMultiplier = 1; }
        if (this.dots.length <= 0) {
            this.make();
        }
        this.cachedSpeedMultiplier = speedMultiplier;
        this.constructTimeline(speedMultiplier);
        if (this.timeline) {
            this.timeline.play();
        }
        return this;
    };
    Ellipsis.prototype.reconstructTimeline = function () {
        if (!this.timeline) {
            return;
        }
        this.constructTimeline(this.cachedSpeedMultiplier);
        if (this.timeline) {
            this.timeline.play();
        }
    };
    Ellipsis.prototype.constructTimeline = function (speedMultiplier) {
        var _this = this;
        if (speedMultiplier === void 0) { speedMultiplier = 1; }
        var progress = 0;
        if (this.timeline) {
            progress = this.timeline.progress;
            this.timeline.stop();
            this.timeline.resetTweens(true);
            this.timeline.destroy();
        }
        this.timeline = this.scene.tweens.timeline({
            loop: -1
        });
        var duration = 500 / speedMultiplier;
        var ease = phaser_1.default.Math.Easing.Quadratic.InOut;
        var newDot = this.dots[0];
        this.timeline.add({
            targets: newDot,
            scale: 1,
            duration: duration,
            ease: ease,
            offset: 0
        });
        var diameter = this.dotRadius * 2;
        var size = this.dots.length - 1;
        for (var i = 1; i < size; ++i) {
            var dot = this.dots[i];
            this.timeline.add({
                targets: dot,
                x: dot.x + diameter + this.gap,
                duration: duration,
                ease: ease,
                offset: 0
            });
        }
        var lastDot = this.dots[size];
        this.timeline.add({
            targets: lastDot,
            scale: 0,
            duration: duration,
            ease: ease,
            offset: 0
        });
        var obj = { count: 0 };
        this.timeline.add({
            targets: obj,
            count: 100,
            duration: 100,
            onComplete: function () {
                newDot.scale = 0;
                lastDot.scale = 1;
                for (var i = 1; i < size; ++i) {
                    var dot = _this.dots[i];
                    dot.x -= diameter + _this.gap;
                }
                _this.handleOnLoop(_this.timeline);
            }
        });
        this.timeline.progress = progress;
        return this.timeline;
    };
    Ellipsis.prototype.handleOnLoop = function (timeline) {
        // implement in subclasses
    };
    Ellipsis.prototype.layout = function () {
        if (this.dots.length < 1) {
            return;
        }
        var diameter = this.dotRadius * 2;
        var width = (diameter * 3) + (this.gap * 2);
        var x = this.position.x - (width * 0.5) + this.dotRadius;
        var dot = this.dots[0];
        dot.x = x;
        dot.y = this.position.y;
        for (var i = 1; i < this.dots.length; ++i) {
            var dot_1 = this.dots[i];
            dot_1.x = x;
            dot_1.y = this.position.y;
            x += this.gap + diameter;
        }
    };
    return Ellipsis;
}());
exports.default = Ellipsis;
