export default class TextView {
  constructor({
    text,
    x,
    y,
    color = "#ffffff",
    font = "20px Arial",
    align = "left",
    baseline = "alphabetic",
    visible = true,
  }) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.font = font;
    this.align = align;
    this.baseline = baseline;
    this.visible = visible;
    this.enabled = false;
  }

  draw(ctx) {
    if (!this.visible || !this.text) return;

    ctx.fillStyle = this.color;
    ctx.font = this.font;
    ctx.textAlign = this.align;
    ctx.textBaseline = this.baseline;

    const lines = String(this.text).split("\n");
    lines.forEach((line, index) => {
      ctx.fillText(line, this.x, this.y + index * 26);
    });
  }
}
