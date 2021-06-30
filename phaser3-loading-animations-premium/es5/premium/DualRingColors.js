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
var DualRing_1 = __importDefault(require("../plus/DualRing"));
var DualRingColors = /** @class */ (function (_super) {
    __extends(DualRingColors, _super);
    function DualRingColors() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.curveColor1 = 0xffffff;
        _this.curveColor2 = 0xffffff;
        return _this;
    }
    DualRingColors.create = function (scene, x, y, radius, color) {
        if (radius === void 0) { radius = 64; }
        if (color === void 0) { color = 0xffffff; }
        return new DualRingColors(scene, x, y, radius, color);
    };
    DualRingColors.prototype.useColor = function (color) {
        this.curveColor1 = color;
        this.curveColor2 = color;
        return this;
    };
    DualRingColors.prototype.useColors = function (color1, color2) {
        this.curveColor1 = color1;
        this.curveColor2 = color2 !== null && color2 !== void 0 ? color2 : color1;
        return this;
    };
    DualRingColors.prototype.make = function () {
        if (this.graphics) {
            this.graphics.destroy();
        }
        var radius = this.radius - this.lineWidth * 0.5;
        var curve1 = new phaser_1.default.Curves.CubicBezier(new phaser_1.default.Math.Vector2(-radius, 0), new phaser_1.default.Math.Vector2(-radius, -radius * 0.5), new phaser_1.default.Math.Vector2(-radius * 0.5, -radius), new phaser_1.default.Math.Vector2(0, -radius));
        var curve2 = new phaser_1.default.Curves.CubicBezier(new phaser_1.default.Math.Vector2(radius, 0), new phaser_1.default.Math.Vector2(radius, radius * 0.5), new phaser_1.default.Math.Vector2(radius * 0.5, radius), new phaser_1.default.Math.Vector2(0, radius));
        this.graphics = this.scene.add.graphics({
            x: this.x, y: this.y
        });
        this.graphics.lineStyle(this.lineWidth, this.curveColor1, 1);
        curve1.draw(this.graphics);
        this.graphics.lineStyle(this.lineWidth, this.curveColor2, 1);
        curve2.draw(this.graphics);
        return this;
    };
    return DualRingColors;
}(DualRing_1.default));
exports.default = DualRingColors;
