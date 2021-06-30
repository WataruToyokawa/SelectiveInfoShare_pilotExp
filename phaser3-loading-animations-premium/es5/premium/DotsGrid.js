"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DotsGrid = /** @class */ (function () {
    function DotsGrid(scene, x, y, width, height, color) {
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 128; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.width = 128;
        this.height = 128;
        this.color = 0xffffff;
        this.dotRadius = 12;
        this.dots = [];
        this.ordering = [
            [0],
            [1, 3],
            [2, 4, 6],
            [5, 7],
            [8]
        ];
        this.tweens = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    DotsGrid.create = function (scene, x, y, width, height, color) {
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 128; }
        if (color === void 0) { color = 0xffffff; }
        return new DotsGrid(scene, x, y, width, height, color);
    };
    Object.defineProperty(DotsGrid.prototype, "x", {
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
    Object.defineProperty(DotsGrid.prototype, "y", {
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
    DotsGrid.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    DotsGrid.prototype.useRadiusForDots = function (radius) {
        this.dotRadius = radius;
        return this;
    };
    DotsGrid.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    DotsGrid.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.dots.length <= 0) {
            this.make();
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
    DotsGrid.prototype.make = function () {
        while (this.dots.length > 0) {
            this.dots.pop().destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < 9; ++i) {
            var dot = this.scene.add.circle(x, y, this.dotRadius, this.color, 1)
                .setAlpha(0.3);
            this.dots.push(dot);
        }
        this.layout();
        return this;
    };
    DotsGrid.prototype.play = function (config) {
        var _this = this;
        if (config === void 0) { config = {}; }
        if (this.dots.length <= 0) {
            this.make();
        }
        while (this.tweens.length > 0) {
            this.tweens.pop().remove();
        }
        var _a = config.reverse, reverse = _a === void 0 ? false : _a, _b = config.spacing, spacing = _b === void 0 ? 200 : _b, _c = config.startAlpha, startAlpha = _c === void 0 ? 0.3 : _c, _d = config.fadeDuration, fadeDuration = _d === void 0 ? 500 : _d;
        var delay = 0;
        var list = reverse ? this.ordering.slice().reverse() : this.ordering;
        for (var j = 0; j < list.length; ++j) {
            var group = list[j];
            for (var i = 0; i < group.length; ++i) {
                var dots = group.map(function (idx) { return _this.dots[idx]; });
                this.scene.tweens.add({
                    targets: dots,
                    alpha: 1,
                    duration: fadeDuration,
                    delay: delay,
                    yoyo: true,
                    repeat: -1,
                    onStart: function (tween, targets) {
                        targets.forEach(function (dot) { return dot.setAlpha(startAlpha); });
                    }
                });
            }
            delay += spacing;
        }
        return this;
    };
    DotsGrid.prototype.layout = function () {
        var cellWidth = this.width / 3;
        var cellHeight = this.height / 3;
        var x = this.position.x - (this.width * 0.5);
        var y = this.position.y - (this.height * 0.5);
        for (var i = 0; i < this.dots.length; ++i) {
            if (i && i % 3 === 0) {
                x = this.position.x - (this.width * 0.5);
                y += cellHeight;
            }
            var dot = this.dots[i];
            dot.x = x + cellWidth * 0.5;
            dot.y = y + cellWidth * 0.5;
            x += cellWidth;
        }
    };
    return DotsGrid;
}());
exports.default = DotsGrid;
