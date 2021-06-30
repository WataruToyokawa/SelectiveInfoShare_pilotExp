"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TailType = void 0;
var phaser_1 = __importDefault(require("phaser"));
var TailType;
(function (TailType) {
    TailType[TailType["NONE"] = 0] = "NONE";
    TailType[TailType["BOTTOM_LEFT"] = 1] = "BOTTOM_LEFT";
    TailType[TailType["BOTTOM_RIGHT"] = 2] = "BOTTOM_RIGHT";
    TailType[TailType["TOP_LEFT"] = 3] = "TOP_LEFT";
    TailType[TailType["TOP_RIGHT"] = 4] = "TOP_RIGHT";
})(TailType = exports.TailType || (exports.TailType = {}));
var TypingBubble = /** @class */ (function () {
    function TypingBubble(scene, x, y, width, height, color) {
        if (width === void 0) { width = 96; }
        if (height === void 0) { height = 64; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.width = 128;
        this.height = 64;
        this.color = 0xffffff;
        this.dotsRadius = 6;
        this.dotsGap = this.dotsRadius * 4;
        this.dotsColors = [0x000000];
        this.dotsColorIndex = 0;
        this.dots = [];
        this.tail = TailType.NONE;
        this.enableStroke = false;
        this.strokeWidth = 8;
        this.strokeColor = 0x000000;
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    TypingBubble.create = function (scene, x, y, width, height, color) {
        if (width === void 0) { width = 96; }
        if (height === void 0) { height = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new TypingBubble(scene, x, y, width, height, color);
    };
    Object.defineProperty(TypingBubble.prototype, "x", {
        get: function () {
            return this.position.x;
        },
        set: function (v) {
            this.position.x = v;
            this.layout();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(TypingBubble.prototype, "y", {
        get: function () {
            return this.position.y;
        },
        set: function (v) {
            this.position.y = v;
            this.layout();
        },
        enumerable: false,
        configurable: true
    });
    TypingBubble.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    TypingBubble.prototype.useStroke = function (color, lineWidth) {
        this.enableStroke = true;
        this.strokeColor = color;
        this.strokeWidth = lineWidth;
        return this;
    };
    TypingBubble.prototype.useRadiusForDots = function (radius) {
        this.dotsRadius = radius;
        return this;
    };
    TypingBubble.prototype.useGapForDots = function (gap) {
        this.dotsGap = gap;
        return this;
    };
    TypingBubble.prototype.useColorForDots = function () {
        var color = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            color[_i] = arguments[_i];
        }
        this.dotsColors = color.slice();
        return this;
    };
    TypingBubble.prototype.useTail = function (type) {
        this.tail = type;
        return this;
    };
    TypingBubble.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    TypingBubble.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (!this.graphics) {
            this.make();
        }
        if (this.graphics) {
            container.add(this.graphics);
        }
        this.dots.forEach(function (dot) {
            container.add(dot);
        });
        if (x !== undefined && y !== undefined) {
            this.setPosition(x, y);
        }
        else if (x !== undefined) {
            this.x = x;
        }
        else if (y !== undefined) {
            this.y = y;
        }
        return this;
    };
    TypingBubble.prototype.make = function () {
        var _a;
        (_a = this.graphics) === null || _a === void 0 ? void 0 : _a.destroy();
        while (this.dots.length > 0) {
            this.dots.pop().destroy();
        }
        var _b = this.position, x = _b.x, y = _b.y;
        var halfWidth = this.width * 0.5;
        var halfHeight = this.height * 0.5;
        var path = new phaser_1.default.Curves.Path(0, 0);
        path.moveTo(-halfWidth, 0);
        path.cubicBezierTo(new phaser_1.default.Math.Vector2(-halfWidth, -halfHeight), new phaser_1.default.Math.Vector2(-halfWidth, -halfHeight), new phaser_1.default.Math.Vector2(-halfWidth * 0.5, -halfHeight));
        path.lineTo(this.width - halfWidth * 1.5, -halfHeight);
        path.cubicBezierTo(new phaser_1.default.Math.Vector2(halfWidth, -halfHeight), new phaser_1.default.Math.Vector2(halfWidth, -halfHeight), new phaser_1.default.Math.Vector2(halfWidth, 0));
        path.cubicBezierTo(new phaser_1.default.Math.Vector2(halfWidth, halfHeight), new phaser_1.default.Math.Vector2(halfWidth, halfHeight), new phaser_1.default.Math.Vector2(halfWidth * 0.5, halfHeight));
        path.lineTo(-halfWidth * 0.5, halfHeight);
        path.cubicBezierTo(new phaser_1.default.Math.Vector2(-halfWidth, halfHeight), new phaser_1.default.Math.Vector2(-halfWidth, halfHeight), new phaser_1.default.Math.Vector2(-halfWidth, 0));
        path.closePath();
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        this.graphics.fillStyle(this.color, 1);
        var tail = this.getTail(this.tail);
        if (tail) {
            this.graphics.fillPoints(tail.getPoints());
        }
        this.graphics.fillPoints(path.getPoints());
        if (this.enableStroke) {
            this.graphics.lineStyle(this.strokeWidth, this.strokeColor, 1);
            path.draw(this.graphics);
            if (tail) {
                tail.draw(this.graphics);
            }
        }
        for (var i = 0; i < 3; ++i) {
            var dot = this.scene.add.circle(x, y, this.dotsRadius, this.getDotColor(), 1);
            this.dots.push(dot);
        }
        this.layout();
        return this;
    };
    TypingBubble.prototype.play = function (config) {
        if (config === void 0) { config = {}; }
        if (!this.graphics) {
            this.make();
        }
        var _a = config.dotFadeDuration, dotFadeDuration = _a === void 0 ? 400 : _a, _b = config.dotFadeOffset, dotFadeOffset = _b === void 0 ? 200 : _b, _c = config.dotsFadeOutDuration, dotsFadeOutDuration = _c === void 0 ? 100 : _c;
        this.timeline = this.scene.tweens.timeline({
            loop: -1
        });
        var offset = 0;
        for (var i = 0; i < this.dots.length; ++i) {
            var dot = this.dots[i];
            dot.setAlpha(0);
            this.timeline.add({
                targets: dot,
                alpha: 1,
                duration: dotFadeDuration,
                ease: phaser_1.default.Math.Easing.Sine.In,
                offset: offset
            });
            offset += dotFadeOffset;
        }
        this.timeline.add({
            targets: this.dots,
            alpha: 0,
            duration: dotsFadeOutDuration
        });
        this.timeline.play();
        return this;
    };
    TypingBubble.prototype.getDotColor = function () {
        if (this.dotsColorIndex > this.dotsColors.length - 1) {
            this.dotsColorIndex = 0;
        }
        var color = this.dotsColors[this.dotsColorIndex];
        ++this.dotsColorIndex;
        return color;
    };
    TypingBubble.prototype.getTail = function (type) {
        if (type === TailType.NONE) {
            return null;
        }
        var halfWidth = this.width * 0.5;
        var halfHeight = this.height * 0.5;
        var th = 16;
        var tw = 14;
        switch (type) {
            case TailType.BOTTOM_RIGHT:
                {
                    var x = halfWidth * 0.6;
                    var y = halfHeight;
                    var tail = new phaser_1.default.Curves.Path(x, y);
                    tail.lineTo(x, y + th);
                    tail.lineTo(x, y + th - (this.strokeWidth * 0.5));
                    tail.cubicBezierTo(new phaser_1.default.Math.Vector2(x - tw, y + th), new phaser_1.default.Math.Vector2(x - tw, y), new phaser_1.default.Math.Vector2(x - tw, y));
                    return tail;
                }
            case TailType.BOTTOM_LEFT:
                {
                    var x = halfWidth * -0.6;
                    var y = halfHeight;
                    var tail = new phaser_1.default.Curves.Path(x, y);
                    tail.lineTo(x, y + th);
                    tail.lineTo(x, y + th - (this.strokeWidth * 0.5));
                    tail.cubicBezierTo(new phaser_1.default.Math.Vector2(x + tw, y + th), new phaser_1.default.Math.Vector2(x + tw, y), new phaser_1.default.Math.Vector2(x + tw, y));
                    return tail;
                }
            case TailType.TOP_LEFT:
                {
                    var x = halfWidth * -0.6;
                    var y = -halfHeight;
                    var tail = new phaser_1.default.Curves.Path(x, y);
                    tail.lineTo(x, y - th);
                    tail.lineTo(x, y - th + (this.strokeWidth * 0.5));
                    tail.cubicBezierTo(new phaser_1.default.Math.Vector2(x + tw, y - th), new phaser_1.default.Math.Vector2(x + tw, y), new phaser_1.default.Math.Vector2(x + tw, y));
                    return tail;
                }
            case TailType.TOP_RIGHT:
                {
                    var x = halfWidth * 0.6;
                    var y = -halfHeight;
                    var tail = new phaser_1.default.Curves.Path(x, y);
                    tail.lineTo(x, y - th);
                    tail.lineTo(x, y - th + (this.strokeWidth * 0.5));
                    tail.cubicBezierTo(new phaser_1.default.Math.Vector2(x - tw, y - th), new phaser_1.default.Math.Vector2(x - tw, y), new phaser_1.default.Math.Vector2(x - tw, y));
                    return tail;
                }
        }
        return null;
    };
    TypingBubble.prototype.layout = function () {
        if (this.graphics) {
            this.graphics.x = this.position.x;
            this.graphics.y = this.position.y;
        }
        var _a = this.position, x = _a.x, y = _a.y;
        var dx = x - this.dotsGap;
        for (var i = 0; i < this.dots.length; ++i) {
            var dot = this.dots[i];
            dot.x = dx;
            dot.y = y;
            // const dot = this.scene.add.circle(dx, y, this.dotsRadius, this.getDotColor(), 1)
            // this.dots.push(dot)
            dx += this.dotsGap;
        }
    };
    return TypingBubble;
}());
exports.default = TypingBubble;
