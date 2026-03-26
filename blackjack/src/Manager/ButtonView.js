export default class ButtonView {
  constructor({
    x,
    y,
    width,
    height,
    text,
    background = "#0b8f3c",
    border = "#ffffff",
    color = "#ffffff",
    disabledBackground = "rgba(255,255,255,0.18)",
    disabledColor = "rgba(255,255,255,0.65)",
    font = "700 20px Arial",
    radius = 12,
    enabled = true,
    onClick = null,
  }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.background = background;
    this.border = border;
    this.color = color;
    this.disabledBackground = disabledBackground;
    this.disabledColor = disabledColor;
    this.font = font;
    this.radius = radius;
    this.enabled = enabled;
    this.visible = true;
    this.onClick = onClick;
  }

  drawRoundedRect(ctx) {
    const { x, y, width, height, radius } = this;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  draw(ctx) {
    if (!this.visible) return;

    this.drawRoundedRect(ctx);
    ctx.fillStyle = this.enabled ? this.background : this.disabledBackground;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = this.border;
    ctx.stroke();

    ctx.fillStyle = this.enabled ? this.color : this.disabledColor;
    ctx.font = this.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
  }

  contains(px, py) {
    return (
      this.enabled &&
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }
}
