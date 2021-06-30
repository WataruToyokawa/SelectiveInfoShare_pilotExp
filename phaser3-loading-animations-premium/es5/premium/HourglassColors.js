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
var phaser_1 = __importDefault(require("phaser"));
var Hourglass_1 = __importDefault(require("../plus/Hourglass"));
var HourglassColors = /** @class */ (function (_super) {
    __extends(HourglassColors, _super);
    function HourglassColors() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.topColor = 0xffffff;
        _this.bottomColor = 0xffffff;
        return _this;
    }
    HourglassColors.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new HourglassColors(scene, x, y, radius, color);
    };
    HourglassColors.prototype.useColor = function (color) {
        this.topColor = color;
        this.bottomColor = color;
        return this;
    };
    HourglassColors.prototype.useColors = function (color, color2) {
        this.topColor = color;
        this.bottomColor = color2 !== null && color2 !== void 0 ? color2 : color;
        return this;
    };
    HourglassColors.prototype.make = function () {
        if (this.graphics) {
            this.graphics.destroy();
        }
        var _a = this.position, x = _a.x, y = _a.y;
        this.graphics = this.scene.add.graphics({ x: x, y: y });
        var radius = this.radius;
        var curve1 = new phaser_1.default.Curves.Path(0, 0);
        curve1.lineTo(-radius, 0);
        curve1.cubicBezierTo(new phaser_1.default.Math.Vector2(-radius, -radius * 0.5), new phaser_1.default.Math.Vector2(-radius * 0.5, -radius), new phaser_1.default.Math.Vector2(0, -radius));
        curve1.lineTo(0, 0);
        var curve2 = new phaser_1.default.Curves.Path(0, 0);
        curve2.lineTo(0, radius);
        curve2.cubicBezierTo(new phaser_1.default.Math.Vector2(radius * 0.5, radius), new phaser_1.default.Math.Vector2(radius, radius * 0.5), new phaser_1.default.Math.Vector2(radius, 0));
        curve2.lineTo(0, 0);
        var rotation = phaser_1.default.Math.DEG_TO_RAD * 45;
        this.graphics.fillStyle(this.topColor, 1);
        var points1 = curve1.getPoints().map(function (pt) { return pt.rotate(rotation); });
        this.graphics.fillPoints(points1);
        this.graphics.fillStyle(this.bottomColor, 1);
        var points2 = curve2.getPoints().map(function (pt) { return pt.rotate(rotation); });
        this.graphics.fillPoints(points2);
        return this;
    };
    return HourglassColors;
}(Hourglass_1.default));
exports.default = HourglassColors;
