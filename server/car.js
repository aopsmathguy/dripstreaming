const { MyMath } = require('./mymath.js');
const { Vector } = require('./vector.js');
const { Physics } = require('./physics.js');
var gravity = 10;
var Car = class {
  cfg;
  body;
  gas;
  brake;
  eBrake;
  steerAngle;
  netWheelForce;
  constructor(opts){
    opts = opts || {};
    this.cfg = new Car.Config(opts.cfg);
    if (opts.body != undefined){
      this.body = Physics.Body.generateBody(opts.body);
    } else{
      this.body = new Physics.PolyBody({points : this.cfg.points, mass : this.cfg.mass, inertia : this.cfg.mass * this.cfg.inertiaScale, kFriction : 0.14, sFriction : 0.2, elasticity : 0.2});
    }
    this.gas = (opts.gas != undefined ? opts.gas : false);
    this.brake = (opts.brake != undefined ? opts.brake : false);
    this.eBrake = (opts.eBrake != undefined ? opts.eBrake : false);
    this.steerAngle = (opts.steerAngle != undefined ? opts.steerAngle : 0);
    this.safeSteer = (opts.safeSteer != undefined ? opts.safeSteer : true);
    this.netWheelForce = Vector.copy(opts.netWheelForce);
  }
  updateInputs(controls, dt){
    var cfg = this.cfg;
    var body = this.body;

    this.gas = controls.keys["ArrowUp"];
    this.brake = controls.keys["ArrowDown"];
    this.eBrake = controls.keys[" "];

    var maxSteer = cfg.maxSteer * (this.safeSteer ? MyMath.clamp(
      1 - Math.min(body.velocity.magnitude(),50)/60
      , -1, 1): 1);
    var steerFraction = this.steerAngle / maxSteer;
    var turnRate = 3;
    if (controls.keys["ArrowLeft"]){
      steerFraction -= dt * turnRate;
    } else if (controls.keys["ArrowRight"]){
      steerFraction += dt * turnRate;
    }
    else{
      if (steerFraction > 0){
        steerFraction -= dt * turnRate/2;
        steerFraction = Math.max(0, steerFraction);
      }
      else{
        steerFraction += dt * turnRate/2;
        steerFraction = Math.min(0, steerFraction);
      }
    }
    steerFraction = MyMath.clamp(steerFraction, -1, 1);
    this.steerAngle = maxSteer * steerFraction;
  }
  display(ctx, dt){
    dt = dt || 0;
    var cfg = this.cfg;
    var body = this.body;
    ctx.save();
    var s = body.lerpedState(dt);
    ctx.translate(s.position.x,s.position.y);
    ctx.rotate(s.angle);

    ctx.beginPath();
    for (var i = 0; i < body.points.length; i++){
      var point = body.points[i];
      if (i == 0){
        ctx.moveTo(point.x, point.y);
      }
      else{
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.closePath();
    // ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(cfg.cgToFrontAxle,cfg.halfFrontAxleLength);
    ctx.rotate(this.steerAngle);
    ctx.beginPath();
    ctx.moveTo(0.3,0.1);
    ctx.lineTo(0.3,-0.1);
    ctx.lineTo(-0.3,-0.1);
    ctx.lineTo(-0.3,0.1);
    ctx.closePath();
    // ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cfg.cgToFrontAxle,-cfg.halfFrontAxleLength);
    ctx.rotate(this.steerAngle);
    ctx.beginPath();
    ctx.moveTo(0.3,0.1);
    ctx.lineTo(0.3,-0.1);
    ctx.lineTo(-0.3,-0.1);
    ctx.lineTo(-0.3,0.1);
    ctx.closePath();
    // ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-cfg.cgToBackAxle,cfg.halfBackAxleLength);
    ctx.beginPath();
    ctx.moveTo(0.3,0.1);
    ctx.lineTo(0.3,-0.1);
    ctx.lineTo(-0.3,-0.1);
    ctx.lineTo(-0.3,0.1);
    ctx.closePath();
    // ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-cfg.cgToBackAxle,-cfg.halfBackAxleLength);
    ctx.beginPath();
    ctx.moveTo(0.3,0.1);
    ctx.lineTo(0.3,-0.1);
    ctx.lineTo(-0.3,-0.1);
    ctx.lineTo(-0.3,0.1);
    ctx.closePath();
    // ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
  displayDirection(ctx, dt){
    var cfg = this.cfg;
    var body = this.body;
    ctx.save();
    var s = body.lerpedState(dt);
    ctx.translate(s.position.x,s.position.y);
    ctx.rotate(s.angle);
    var length = 6;
    ctx.setLineDash([0.5, 0.5]);
    if (Math.abs(this.steerAngle) < 0.001){
      ctx.beginPath();
      ctx.moveTo(cfg.cgToFrontAxle,cfg.halfFrontAxleLength);
      ctx.lineTo(cfg.cgToFrontAxle+length,cfg.halfFrontAxleLength);
      ctx.moveTo(cfg.cgToFrontAxle,-cfg.halfFrontAxleLength);
      ctx.lineTo(cfg.cgToFrontAxle+length,-cfg.halfFrontAxleLength);
      ctx.stroke();
    } else if (this.steerAngle > 0){
      ctx.beginPath();
      var l = cfg.cgToFrontAxle + cfg.cgToBackAxle;
      var r = l/Math.sin(this.steerAngle);
      ctx.arc(-cfg.cgToBackAxle, l/Math.tan(this.steerAngle), r + cfg.halfFrontAxleLength, this.steerAngle - Math.PI/2, this.steerAngle - Math.PI/2 + length/r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-cfg.cgToBackAxle, l/Math.tan(this.steerAngle), r - cfg.halfFrontAxleLength, this.steerAngle - Math.PI/2, this.steerAngle - Math.PI/2 + length/r);
      ctx.stroke();
    } else{
      ctx.beginPath();
      var l = cfg.cgToFrontAxle + cfg.cgToBackAxle;
      var r = -l/Math.sin(this.steerAngle);
      ctx.arc(-cfg.cgToBackAxle, l/Math.tan(this.steerAngle), r + cfg.halfFrontAxleLength, this.steerAngle + Math.PI/2, this.steerAngle + Math.PI/2 - length/r, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-cfg.cgToBackAxle, l/Math.tan(this.steerAngle), r - cfg.halfFrontAxleLength, this.steerAngle + Math.PI/2, this.steerAngle + Math.PI/2 - length/r, true);
      ctx.stroke();
    }
    ctx.restore();
  }
  step(dt){
    var cfg = this.cfg;
    var body = this.body;

    var carDir = (new Vector(1,0)).rotate(body.angle);


//     if (!this.netWheelForce.x || !this.netWheelForce.y){
//       this.netWheelForce = new Vector(0,0);
//     }
    var wFAlongCar = this.netWheelForce.dot(carDir);
    var l = cfg.cgToFrontAxle + cfg.cgToBackAxle;
    var fwWeight = -wFAlongCar * cfg.cgHeight/l + body.mass * gravity * cfg.cgToFrontAxle/l;
    var bwWeight = wFAlongCar * cfg.cgHeight/l + body.mass * gravity * cfg.cgToBackAxle/l;
    var fwR = carDir.multiplyV(new Vector(cfg.cgToFrontAxle, 0));
    var bwR = (new Vector(-cfg.cgToBackAxle, 0)).multiplyV(carDir);
    var fwV = body.getVelocity(fwR);
    var bwV = body.getVelocity(bwR);

    var tireGripFront = cfg.maxTireGrip;
	  var tireGripRear = cfg.maxTireGrip * (1.0 - (this.eBrake ? 0 : 1) * (1.0 - cfg.lockGrip)); //

    var fwDir = body.angle + this.steerAngle;
    var fwSlipAng = fwV.ang() - fwDir;
    var fwForce = new Vector(0, fwWeight * MyMath.clamp(-cfg.cornerStiffnessFront * Math.sin(fwSlipAng), -tireGripFront, tireGripFront)).rotate(fwDir);

    var bwDir = body.angle;
    var bwSlipAng = bwV.ang() - bwDir;
    var bwForce = new Vector(0, bwWeight * MyMath.clamp(-cfg.cornerStiffnessBack * Math.sin(bwSlipAng), -tireGripRear, tireGripRear)).rotate(bwDir);
    var engineForce;

    var rpm = Math.abs(carDir.dot(body.velocity));
    if (rpm < 24){
      rpm = 24;
    }
    engineForce = carDir.multiply(
      (this.gas ? cfg.enginePower/Math.abs(rpm) : 0)
      - (this.brake ? (carDir.dot(body.velocity) > 0 ? cfg.brakeForce : cfg.enginePower/Math.abs(rpm)) : 0)
      - MyMath.sign(carDir.dot(body.velocity)) * (this.eBrake ? cfg.ebrakeForce : 0)
    );
    var dragForce = body.velocity.multiply(-cfg.dragCoefficient * body.velocity.magnitude());
    var rollForce = carDir.multiply(-body.velocity.dot(carDir) * cfg.rollingResistance);
    body.applyImpulse(engineForce.multiply(dt));
    body.applyImpulse(dragForce.multiply(dt));
    body.applyImpulse(rollForce.multiply(dt));

    body.applyImpulse(fwForce.multiply(dt), fwR);
    body.applyImpulse(bwForce.multiply(dt), bwR);
    this.netWheelForce = engineForce.add(rollForce).add(fwForce).add(bwForce);

  }
}
Car.Config = class{
  points;
  mass;
  inertiaScale;

  maxSteer;
  halfFrontAxleLength;
  halfBackAxleLength;

  cgToFrontAxle;
  cgToBackAxle;
  cgHeight;
  maxTireGrip;
  engineForce;
  brakeForce;
  dragCoefficient;
  rollingResistance;
  constructor(opts){
    opts = opts || {};
    this.points = opts.points || [
      new Vector(2.2,0.8),
      new Vector(2.2,-0.8),
      new Vector(-2.2,-0.8),
      new Vector(-2.2,0.8)
    ];
    this.mass = opts.mass || 1200;//1000 kg
    this.inertiaScale = opts.inertiaScale || 1.87;

    this.maxSteer = opts.maxSteer || 0.5;
    this.halfFrontAxleLength = opts.halfFrontAxleLength || 0.8;
    this.halfBackAxleLength = opts.halfBackAxleLength || 0.8;

    this.cgToFrontAxle = opts.cgToFrontAxle || 1.3;//m
    this.cgToBackAxle = opts.cgToBackAxle || 1.3;//m
    this.cgHeight = opts.cgHeight || 0.5;//m
    this.maxTireGrip = opts.maxTireGrip || 2;//
    this.lockGrip = opts.lockGrip || 0.7;//

    this.cornerStiffnessFront = opts.cornerStiffnessFront || 5.0;
    this.cornerStiffnessBack = opts.cornerStiffnessBack || 5.2;
    this.enginePower = opts.enginePower || 300000;// watts

    this.brakeForce = opts.brakeForce || 12000;// newtons
    this.ebrakeForce = opts.ebrakeForce || this.brakeForce / 2.5;

    this.dragCoefficient = opts.dragCoefficient || 0.4257;
    this.rollingResistance = opts.rollingResistance || 12.8;
  }
}

module.exports = {
  Car,
}
