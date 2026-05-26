class Vertex2 {
  constructor(x, y) {
      this.x = x
      this.y = y
  }
  getClone(){
    return new Vertex2(this.x, this.y);
  }
  getSubtract(other) {
      return new Vertex2(this.x - other.x, this.y - other.y);
  }
  getAdd(other) {
      return new Vertex2(other.x + this.x, other.y + this.y);
  }
  getScaled(scalar) {
      return new Vertex2(this.x * scalar, this.y * scalar);
  }
  getLength() {
      return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
  getNormalized() {
      return new Vertex2(this.x / this.getLength(), this.y / this.getLength());
  }
  getPerpendicular() {
      return new Vertex2(-this.y, this.x);
  }
  getDot(other) {
      return this.x * other.x + this.y * other.y;
  }
}