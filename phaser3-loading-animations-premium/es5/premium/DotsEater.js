"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DotsEater = /** @class */ (function () {
    function DotsEater(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 48; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.radius = 64;
        this.eaterColor = 0xffffff;
        this.dotsColors = [];
        this.dotsColorIndex = 0;
        this.dotsRadius = 6;
        this.dots = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.radius = radius;
        this.eaterColor = color;
        this.dotsColors.push(color);
    }
    DotsEater.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 48; }
        if (color === void 0) { color = 0xffffff; }
        return new DotsEater(scene, x, y, radius, color);
    };
    DotsEater.prototype.useEaterColor = function (color) {
        this.eaterColor = color;
        return this;
    };
    DotsEater.prototype.useDotColor = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.dotsColors = colors.slice();
        return this;
    };
    DotsEater.prototype.useRadiusForDots = function (radius) {
        this.dotsRadius = radius;
        return this;
    };
    DotsEater.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.topJaw || !this.bottomJaw) {
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
        this.dots.forEach(function (dot) {
            container.add(dot);
        });
        if (this.topJaw) {
            container.add(this.topJaw);
        }
        if (this.bottomJaw) {
            container.add(this.bottomJaw);
        }
        this.layout();
        this.reconstructDotsTimeline();
        return this;
    };
    DotsEater.prototype.make = function () {
        var _a, _b;
        (_a = this.topJaw) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.bottomJaw) === null || _b === void 0 ? void 0 : _b.destroy();
        var _c = this.position, x = _c.x, y = _c.y;
        var dotRadius = this.dotsRadius;
        // const gap = dotRadius * 4
        // let dx = x + gap
        for (var i = 0; i < 3; ++i) {
            var dot = this.scene.add.circle(x, y, dotRadius, this.getDotColor(), 1);
            this.dots.push(dot);
            // dx += gap
        }
        this.topJaw = this.scene.add.arc(x, y, this.radius, 90, 270, false, this.eaterColor, 1)
            .setAngle(90);
        this.bottomJaw = this.scene.add.arc(x, y, this.radius, 90, 270, false, this.eaterColor, 1)
            .setAngle(-90);
        this.layout();
        return this;
    };
    DotsEater.prototype.play = function (config) {
        var _a, _b;
        if (config === void 0) { config = {}; }
        if (!this.topJaw || !this.bottomJaw) {
            this.make();
        }
        (_a = this.eaterTimeline) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = this.dotsTimeline) === null || _b === void 0 ? void 0 : _b.destroy();
        var _c = config.eatSpeedMultiplier, eatSpeedMultiplier = _c === void 0 ? 1 : _c, _d = config.dotSpeedMultiplier, dotSpeedMultiplier = _d === void 0 ? 1 : _d;
        this.cachedConfig = config;
        this.eaterTimeline = this.scene.tweens.timeline({
            loop: -1
        });
        var eatDuration = 300 / eatSpeedMultiplier;
        this.eaterTimeline.add({
            targets: this.topJaw,
            angle: this.topJaw.angle - 45,
            yoyo: true,
            duration: eatDuration,
            offset: 0
        });
        this.eaterTimeline.add({
            targets: this.bottomJaw,
            angle: this.bottomJaw.angle + 45,
            yoyo: true,
            duration: eatDuration,
            offset: 0
        });
        this.eaterTimeline.play();
        this.constructDotsTimeline(dotSpeedMultiplier);
        if (this.dotsTimeline) {
            this.dotsTimeline.play();
        }
        return this;
    };
    DotsEater.prototype.reconstructDotsTimeline = function () {
        var _a;
        if (!this.dotsTimeline) {
            return;
        }
        var _b = ((_a = this.cachedConfig) !== null && _a !== void 0 ? _a : {}).dotSpeedMultiplier, dotSpeedMultiplier = _b === void 0 ? 1 : _b;
        this.constructDotsTimeline(dotSpeedMultiplier);
        if (this.dotsTimeline) {
            this.dotsTimeline.play();
        }
    };
    DotsEater.prototype.constructDotsTimeline = function (dotSpeedMultiplier) {
        var _this = this;
        if (dotSpeedMultiplier === void 0) { dotSpeedMultiplier = 1; }
        if (this.dotsTimeline) {
            this.dotsTimeline.stop();
            this.dotsTimeline.resetTweens(true);
            this.dotsTimeline.destroy();
        }
        this.dotsTimeline = this.scene.tweens.timeline({
            loop: -1
        });
        var dotRadius = this.dotsRadius;
        var gap = dotRadius * 4;
        var dotDuration = 250 / dotSpeedMultiplier;
        var size = this.dots.length;
        var _loop_1 = function (i) {
            var dot = this_1.dots[i];
            var nextDot = i < size - 1 ? this_1.dots[i + 1] : null;
            this_1.dotsTimeline.add({
                targets: dot,
                x: dot.x - gap,
                duration: dotDuration,
                offset: 0,
                onComplete: function () {
                    dot.x += gap;
                    if (nextDot) {
                        dot.fillColor = nextDot.fillColor;
                    }
                    else {
                        dot.alpha = 0;
                        dot.fillColor = _this.getDotColor();
                    }
                }
            });
        };
        var this_1 = this;
        for (var i = 0; i < size; ++i) {
            _loop_1(i);
        }
        var lastDot = this.dots[this.dots.length - 1];
        lastDot.alpha = 0;
        this.dotsTimeline.add({
            targets: lastDot,
            alpha: 1,
            duration: dotDuration * 0.8,
            offset: 0
        });
    };
    DotsEater.prototype.getDotColor = function () {
        if (this.dotsColorIndex > this.dotsColors.length - 1) {
            this.dotsColorIndex = 0;
        }
        var color = this.dotsColors[this.dotsColorIndex];
        ++this.dotsColorIndex;
        return color;
    };
    DotsEater.prototype.layout = function () {
        var _a = this.position, x = _a.x, y = _a.y;
        var dotRadius = this.dotsRadius;
        var gap = dotRadius * 4;
        var dx = x + gap;
        for (var i = 0; i < this.dots.length; ++i) {
            var dot = this.dots[i];
            dot.x = dx;
            dot.y = y;
            // const dot = this.scene.add.circle(dx, y, dotRadius, this.getDotColor(), 1)
            // this.dots.push(dot)
            dx += gap;
        }
        if (this.topJaw) {
            this.topJaw.x = x;
            this.topJaw.y = y;
        }
        if (this.bottomJaw) {
            this.bottomJaw.x = x;
            this.bottomJaw.y = y;
        }
        // this.topJaw = this.scene.add.arc(x, y, this.radius, 90, 270, false, this.eaterColor, 1)
        // 	.setAngle(90)
        // this.bottomJaw = this.scene.add.arc(x, y, this.radius, 90, 270, false, this.eaterColor, 1)
        // 	.setAngle(-90)
    };
    return DotsEater;
}());
exports.default = DotsEater;
