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
var DotsGrid_1 = __importDefault(require("./DotsGrid"));
var DotsGridColors = /** @class */ (function (_super) {
    __extends(DotsGridColors, _super);
    function DotsGridColors(scene, x, y, width, height, color) {
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 128; }
        if (color === void 0) { color = 0xffffff; }
        var _this = _super.call(this, scene, x, y, width, height, color) || this;
        _this.colors = [];
        _this.colorIndex = 0;
        _this.colors.push(color);
        return _this;
    }
    DotsGridColors.create = function (scene, x, y, width, height, color) {
        if (width === void 0) { width = 128; }
        if (height === void 0) { height = 128; }
        if (color === void 0) { color = 0xffffff; }
        return new DotsGridColors(scene, x, y, width, height, color);
    };
    DotsGridColors.prototype.useColor = function (color) {
        this.colors = [color];
        return this;
    };
    DotsGridColors.prototype.useColors = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.colors = colors.slice();
        return this;
    };
    DotsGridColors.prototype.make = function () {
        _super.prototype.make.call(this);
        for (var i = 0; i < this.ordering.length; ++i) {
            var color = this.getColor();
            var group = this.ordering[i];
            for (var j = 0; j < group.length; ++j) {
                var dot = this.dots[group[j]];
                dot.fillColor = color;
            }
        }
        return this;
    };
    DotsGridColors.prototype.getColor = function () {
        if (this.colorIndex > this.colors.length - 1) {
            this.colorIndex = 0;
        }
        var color = this.colors[this.colorIndex];
        ++this.colorIndex;
        return color;
    };
    return DotsGridColors;
}(DotsGrid_1.default));
exports.default = DotsGridColors;
