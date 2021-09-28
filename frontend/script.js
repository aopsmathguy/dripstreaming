const socket = io('http://localhost:3000', { transports : ['websocket'] });

socket.on('startState', onStartState);
socket.on('gameState', onGameState);
socket.on('join', onJoin);
socket.on('leave', onLeave);
socket.on('pong', onPong);

var canvas = $e("canvas");
var ctx = canvas.getContext("2d");
var world;
var staticBodies;
var carWorld;
var myId;
var dt;

var lastRecieve;
var physicsTime;
var timeDiff = 0;
var ping = 0;
function startGame(){
  world = new Physics.World();
  staticBodies = [];
  carWorld = new Car.World();
  socket.emit('joinGame');
}
function onStartState(e){
  myId = e.id;
  for (var i = 0; i < e.staticBodies.length; i++){
    staticBodies[i] = Physics.Body.generateBody(e.staticBodies[i]);
  }
  for (var i in e.cars){
    carWorld.cars[i] = new Car(e.cars[i]);
  }
  for (var i = 0; i < staticBodies.length; i++){
    world.addBody(staticBodies[i]);
  }
  for (var i in carWorld.cars){
    world.addBody(carWorld.cars[i].body);
  }
  dt = e.dt;
  controlsQueue.start(dt);
  setInterval(()=>{
    socket.emit("ping", Date.now());
  }, 500);
  frameStep();
}
function onGameState(e){
  physicsTime = e.time;
  for (var i in carWorld.cars){
    var c = carWorld.cars[i];
    var o = e.cars[i];
    c.gas = o.gas;
    c.brake = o.brake;
    c.eBrake = o.eBrake;
    c.steerAngle = o.steerAngle;
    c.netWheelForce = Vector.copy(o.netWheelForce);
    c.body.position = Vector.copy(o.body.position);
    c.body.velocity = Vector.copy(o.body.velocity);
    c.body.angle = o.body.angle;
    c.body.angleVelocity = o.body.angleVelocity;
  }
}
function onJoin(e){
  var id = e.id;
  if (id == myId){
    return;
  }
  carWorld.cars[id] = new Car(e.car);
  world.addBody(carWorld.cars[id].body);
}
function onLeave(e){
  var id = e.id;
  if (id == myId){
    return;
  }
  if (carWorld.cars[id]){
    world.removeBody(carWorld.cars[id].body);
  }
  delete carWorld.cars[id];
}
function onPong(e){
  var t = Date.now();
  ping += 0.1 * ((t - e.cTime) - ping);
  var equivCTime = (t + e.cTime)/2;
  timeDiff += 0.1 * ((equivCTime - e.sTime) - timeDiff);
}
function frameStep(){
  requestAnimationFrame(frameStep);

  var sDispTime = Date.now() - timeDiff - ping/2;
  while (physicsTime < sDispTime){
    step(dt);
    physicsTime += dt*1000;
  }

  clearCanvas();
  display((sDispTime - physicsTime)/1000);
}
function display(dt){
  var state = carWorld.cars[myId].body.lerpedState(dt);
  world.transform(ctx, ()=> {
    ctx.save();
    var translate = state.position.subtract(world.dimensionsInMeters().multiply(0.5));
    ctx.translate(-translate.x, -translate.y);
    var min = state.position.subtract(world.dimensionsInMeters().multiply(0.5));
    var max = state.position.add(world.dimensionsInMeters().multiply(0.5));

    ctx.lineWidth = 0.3;
    ctx.fillStyle = "rgba(255,255,255,0)";
    ctx.strokeStyle = "#ff0";
    world.displayRectStatic(ctx, min, max, dt);
    // ctx.fillStyle = "#ff0";
    // carWorld.pWorld.display(ctx);
    ctx.strokeStyle = "#f00";
    carWorld.cars[myId].displayDirection(ctx, dt);
    ctx.strokeStyle = "#0f0";
    for (var i in carWorld.cars){
      var c = carWorld.cars[i];
      c.display(ctx, dt);
    }
    ctx.restore();
  });
}
function step(dt){
  carWorld.cars[myId].updateInputs(controlsQueue.q.get(Math.min(Math.floor(ping /(1000*dt)), controlsQueue.q.size() - 1)), dt);
  carWorld.step(dt);
  world.step(dt);
}
function clearCanvas(){
  canvas.width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  canvas.height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
