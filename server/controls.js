var UserControls = class{
  keys;
  mouse;
  mouseDown;
  constructor(){
    this.keys = {};
    this.mouse = new Vector(0,0);
    this.mouseDown = false;
  }
  keyDown(key){
    this.keys[key] = true;
  }
  keyUp(key){
    this.keys[key] = false;
  }
  mouseDown(){
    this.mouse = true;
  }
  mouseUp(){
    this.mouse = false;
  }
  mouseMove(x,y){
    this.mouse.x = x;
    this.mouse.y = y;
  }
};
