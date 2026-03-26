export default class ImageView {
  constructor(image, x, y, width, height) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.visible = true;
    this.enabled = true;
    this.onClick = null;
  }

  draw(ctx) {
    if (!this.visible || !this.image) return;
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  contains(px, py) {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }
}
