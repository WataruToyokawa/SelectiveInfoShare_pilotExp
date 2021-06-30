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
var Ellipsis_1 = __importDefault(require("../basic/Ellipsis"));
var EllipsisColors = /** @class */ (function (_super) {
    __extends(EllipsisColors, _super);
    function EllipsisColors(scene, x, y, color) {
        if (color === void 0) { color = 0xffffff; }
        var _this = _super.call(this, scene, x, y, color) || this;
        _this.colors = [];
        _this.colorIndex = 0;
        _this.colors.push(color);
        return _this;
    }
    EllipsisColors.create = function (scene, x, y, color) {
        if (color === void 0) { color = 0xffffff; }
        return new EllipsisColors(scene, x, y, color);
    };
    EllipsisColors.prototype.useColor = function (color) {
        this.colors = [color];
        return this;
    };
    EllipsisColors.prototype.useColors = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.colors = colors.slice();
        return this;
    };
    EllipsisColors.prototype.make = function () {
        var _this = this;
        _super.prototype.make.call(this);
        this.dots.forEach(function (dot) { return dot.fillColor = _this.getColor(); });
        return this;
    };
    EllipsisColors.prototype.play = function (speedMultiplier) {
        if (speedMultiplier === void 0) { speedMultiplier = 1; }
        _super.prototype.play.call(this, speedMultiplier);
        return this;
    };
    EllipsisColors.prototype.handleOnLoop = function (timeline) {
        for (var i = this.dots.length - 1; i > 0; --i) {
            this.dots[i].fillColor = this.dots[i - 1].fillColor;
        }
        this.dots[0].fillColor = this.getColor();
    };
    EllipsisColors.prototype.getColor = function () {
        if (this.colorIndex > this.colors.length - 1) {
            this.colorIndex = 0;
        }
        var color = this.colors[this.colorIndex];
        ++this.colorIndex;
        return color;
    };
    return EllipsisColors;
}(Ellipsis_1.default));
exports.default = EllipsisColors;
