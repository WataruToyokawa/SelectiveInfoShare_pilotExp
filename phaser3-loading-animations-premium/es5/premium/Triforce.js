"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var phaser_1 = __importDefault(require("phaser"));
var Triforce = /** @class */ (function () {
    function Triforce(scene, x, y, width, height, color) {
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 96; }
        if (color === void 0) { color = 0xffffff; }
        this.position = { x: 0, y: 0 };
        this.width = 128;
        this.height = 128;
        this.color = 0xffffff;
        this.triangles = [];
        this.scene = scene;
        this.position.x = x;
        this.position.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    Triforce.create = function (scene, x, y, width, height, color) {
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 96; }
        if (color === void 0) { color = 0xffffff; }
        return new Triforce(scene, x, y, width, height, color);
    };
    Object.defineProperty(Triforce.prototype, "x", {
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
    Object.defineProperty(Triforce.prototype, "y", {
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
    Triforce.prototype.useColor = function (color) {
        this.color = color;
        return this;
    };
    Triforce.prototype.setPosition = function (x, y) {
        this.position.x = x;
        this.position.y = y;
        this.layout();
        return this;
    };
    Triforce.prototype.addToContainer = function (container, x, y) {
        if (!container) {
            return this;
        }
        if (this.triangles.length <= 0) {
            this.make();
        }
        this.triangles.forEach(function (tri) {
            container.add(tri);
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
    Triforce.prototype.make = function () {
        while (this.triangles.length > 0) {
            this.triangles.pop().destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        for (var i = 0; i < 3; ++i) {
            this.triangles.push(this.createTriangle(x, y));
        }
        this.layout();
        return this;
    };
    Triforce.prototype.play = function (config) {
        var _a;
        if (config === void 0) { config = {}; }
        if (this.triangles.length <= 0) {
            this.make();
        }
        (_a = this.timeline) === null || _a === void 0 ? void 0 : _a.destroy();
        var _b = config.spinDuration, spinDuration = _b === void 0 ? 400 : _b, _c = config.spinOffset, spinOffset = _c === void 0 ? 0 : _c, _d = config.loopDelay, loopDelay = _d === void 0 ? 200 : _d;
        this.timeline = this.scene.tweens.timeline({
            loop: -1,
            loopDelay: loopDelay
        });
        var offset = 0;
        for (var i = 0; i < this.triangles.length; ++i) {
            var tri = this.triangles[i];
            this.timeline.add({
                targets: tri,
                scaleX: 0,
                duration: spinDuration,
                yoyo: true,
                ease: phaser_1.default.Math.Easing.Sine.InOut,
                offset: offset
            });
            offset += spinOffset;
        }
        this.timeline.play();
        return this;
    };
    Triforce.prototype.createTriangle = function (x, y) {
        var triangleWidth = this.width * 0.5;
        var triangleHalfWidth = triangleWidth * 0.5;
        var triangleHeight = this.height * 0.5;
        return this.scene.add.triangle(x, y, 0, triangleHeight, triangleHalfWidth, 0, triangleWidth, triangleHeight, this.color, 1);
    };
    Triforce.prototype.layout = function () {
        var _a = this.position, x = _a.x, y = _a.y;
        var triangleHalfWidth = this.width * 0.25;
        var triangleHalfHeight = this.height * 0.25;
        var top = this.triangles[0];
        if (top) {
            top.x = x;
            top.y = y - triangleHalfHeight;
        }
        var left = this.triangles[1];
        if (left) {
            left.x = x - triangleHalfWidth;
            left.y = y + triangleHalfHeight;
        }
        var right = this.triangles[2];
        if (right) {
            right.x = x + triangleHalfWidth;
            right.y = y + triangleHalfHeight;
        }
    };
    return Triforce;
}());
exports.default = Triforce;
