class Vertex3 {
  constructor(x, y, z) {
      [this.x, this.y, this.z] = [x, y, z]
  }
  getClone(){
    return new Vertex3(this.x, this.y, this.z);
  }
  getSubtract(other) {
      return new Vertex3(this.x - other.x, this.y - other.y, this.z - other.z);
  }
  getAdd(other) {
      return new Vertex3(this.x + other.x, this.y + other.y, this.z - other.z);
  }
  getScaled(scalar) {
      return new Vertex3(this.x * scalar, this.y * scalar, this.z * scalar);
  }
  getLength() {
      return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z**2);
  }
  getNormalized() {
      return new Vertex3(this.x / this.getLength(), this.y / this.getLength(), this.z/this.getLength());
  }
  
  getDot(other) {
      return this.x * other.x + this.y * other.y + this.z * other.z;
  }
  getCross(other){
    let x = this.y * other.z - this.z* other.y
    let y = this.z * other.x - this.x * other.z;
    let z = this.x * other.y - this.y * other.x;
    return new Vertex3(x, y, z);
  }
}