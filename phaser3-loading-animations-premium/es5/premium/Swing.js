"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var Swing = /** @class */ (function () {
    function Swing(scene, x, y, width, height, color) {
        if (width === void 0) { width = 96; }
        if (height === void 0) { height = 96; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.width = 128;
        this.height = 128;
        this.leftDotColor = 0xffffff;
        this.rightDotColor = 0xffffff;
        this.duration = 400;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.width = width;
        this.height = height;
        this.leftDotColor = color;
        this.rightDotColor = color;
    }
    Swing.create = function (scene, x, y, width, height, color) {
        if (width === void 0) { width = 96; }
        if (height === void 0) { height = 96; }
        if (color === void 0) { color = 0xffffff; }
        return new Swing(scene, x, y, width, height, color);
    };
    Swing.prototype.useColor = function (color) {
        this.leftDotColor = color;
        this.rightDotColor = color;
        return this;
    };
    Swing.prototype.useColors = function (color1, color2) {
        this.leftDotColor = color1;
        this.rightDotColor = color2 !== null && color2 !== void 0 ? color2 : color1;
        return this;
    };
    Swing.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.leftDot || !this.rightDot) {
            this.make();
        }
        if (this.leftDot) {
            container.add(this.leftDot);
        }
        if (this.rightDot) {
            container.add(this.rightDot);
        }
        if (x !== undefined && y !== undefined) {
            this.position.x = x;
            this.position.y = y;
            this.layout();
            this.reconstructTimelines();
        }
        else if (x !== undefined) {
            this.position.x = x;
            this.layout();
            this.reconstructTimelines();
        }
        else if (y !== undefined) {
            this.position.y = y;
            this.layout();
            this.reconstructTimelines();
        }
        return this;
    };
    Swing.prototype.make = function () {
        var _a, _b;
        (_a = this.leftDot) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.rightDot) === null || _b === void 0 ? void 0 : _b.destroy();
        var quarterWidth = this.width * 0.25;
        var radius = quarterWidth;
        var _c = this.position, x = _c.x, y = _c.y;
        this.leftDot = this.scene.add.circle(x, y, radius, this.leftDotColor);
        this.rightDot = this.scene.add.circle(x, y, radius, this.rightDotColor);
        this.layout();
        return this;
    };
    Swing.prototype.play = function (duration) {
        if (duration === void 0) { duration = 400; }
        if (!this.leftDot || !this.rightDot) {
            this.make();
        }
        this.duration = duration;
        this.reconstructTimelines();
        return this;
    };
    Swing.prototype.reconstructTimelines = function () {
        var _this = this;
        if (this.leftDotTimeline) {
            this.leftDotTimeline.stop();
            this.leftDotTimeline.resetTweens(true);
            this.leftDotTimeline.destroy();
        }
        if (this.rightDotTimeline) {
            this.rightDotTimeline.stop();
            this.rightDotTimeline.resetTweens(true);
            this.rightDotTimeline.destroy();
        }
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
        var quarterWidth = this.width * 0.25;
        var quarterHeight = this.height * 0.25;
        this.leftDotTimeline = this.timelineForDot(this.leftDot, quarterWidth, quarterHeight, this.duration);
        this.leftDotTimeline.play();
        this.rightDotTimeline = this.timelineForDot(this.rightDot, -quarterWidth, quarterHeight, this.duration);
        this.timerEvent = this.scene.time.delayedCall(this.duration * 0.5, function () {
            _this.rightDotTimeline.play();
        });
    };
    Swing.prototype.timelineForDot = function (dot, dx, dy, duration) {
        var _a = this.position, x = _a.x, y = _a.y;
        var timeline = this.scene.tweens.timeline({
            loop: -1
        });
        var halfDuration = duration * 0.5;
        timeline.add({
            targets: dot,
            x: x + dx,
            y: y + dy,
            ease: phaser_1.default.Math.Easing.Sine.InOut,
            duration: duration
        });
        timeline.add({
            targets: dot,
            scale: 0.2,
            ease: phaser_1.default.Math.Easing.Sine.InOut,
            duration: halfDuration,
            offset: 0,
            yoyo: true
        });
        timeline.add({
            targets: dot,
            x: x - dx,
            y: y - dy,
            ease: phaser_1.default.Math.Easing.Sine.InOut,
            duration: duration,
            offset: duration
        });
        timeline.add({
            targets: dot,
            scale: 0.2,
            ease: phaser_1.default.Math.Easing.Sine.InOut,
            duration: halfDuration,
            offset: duration,
            yoyo: true
        });
        return timeline;
    };
    Swing.prototype.layout = function () {
        var quarterWidth = this.width * 0.25;
        var quarterHeight = this.height * 0.25;
        var _a = this.position, x = _a.x, y = _a.y;
        if (this.leftDot) {
            this.leftDot.x = x - quarterWidth;
            this.leftDot.y = y - quarterHeight;
        }
        if (this.rightDot) {
            this.rightDot.x = x + quarterWidth;
            this.rightDot.y = y - quarterHeight;
        }
    };
    return Swing;
}());
exports.default = Swing;
