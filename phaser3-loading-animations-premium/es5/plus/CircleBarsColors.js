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
var CircleBars_1 = __importDefault(require("../basic/CircleBars"));
var CircleBarsColors = /** @class */ (function (_super) {
    __extends(CircleBarsColors, _super);
    function CircleBarsColors(scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        var _this = _super.call(this, scene, x, y, radius, color) || this;
        _this.colors = [];
        _this.colorIndex = 0;
        _this.colors.push(color);
        return _this;
    }
    CircleBarsColors.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new CircleBarsColors(scene, x, y, radius, color);
    };
    CircleBarsColors.prototype.useColor = function (color) {
        this.colors = [color];
        return this;
    };
    CircleBarsColors.prototype.useColors = function () {
        var colors = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
        }
        this.colors = colors.slice();
        return this;
    };
    CircleBarsColors.prototype.make = function () {
        var _this = this;
        _super.prototype.make.call(this);
        this.bars.forEach(function (bar) {
            bar.fillColor = _this.getColor();
        });
        return this;
    };
    CircleBarsColors.prototype.getColor = function () {
        if (this.colorIndex > this.colors.length - 1) {
            this.colorIndex = 0;
        }
        var color = this.colors[this.colorIndex];
        ++this.colorIndex;
        return color;
    };
    return CircleBarsColors;
}(CircleBars_1.default));
exports.default = CircleBarsColors;
