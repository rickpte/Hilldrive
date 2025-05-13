
var width, height, canvas, ctx;
var backpic = new Image();
var carpic = new Image();
var wheelpic = new Image();
var levelpic = new Image();

var factor = 36; // 200 / 5.5;
var offset = 0;
var drawForces = false;
var mode = 0;
var fps = 0, lastFps = 0;
var gameTime = 0, countTime = 0;
var lastTick = new Date();
var deltaTime = .0167;
var keySpace = false, keyUp = false, keyDown = false, keyLeft = false, keyRight = false;
var finished = false;
var gas = 0, brake = 0;

var mobileControls = false;
var touchDown = false, touchX = 0;

var carMass = 3000;
var carAngularInertia = 10000;
var wheelAttach = [[-1.55, -.7], [1.9, -.7]];
var colPoints = [[2.7, -.2], [2.5, .5], [.4, 1.5], [-2.4, 1.5], [-2.6, -.2]];
var springConstant = 100000;
var dampConstant = 10000;
var maxDrive = 30000;
var colsf = 200000;
var coldf = 10000;

var carX = [4, 4];
var carR = 0;
var carUp = [0, 1];
var carForward = [1, 0];
var carForce = [0, 0];
var carAcceleration = [0, 0];
var carVelocity = [0, 0];
var carSpeed = 0;
var carAngularVelocity = 0;
var carAngularTorque = 0;

var carResistanceF = [0, 0];

var wheelX = [[0, 0], [0, 0]];
var wheelN = [[0, 0], [0, 0]];
var springCompression = [0, 0];
var lastSpringCompression = [0, 0];
var wheelP = [0, 0];
var wheelSuspension = [[0, 0], [0, 0]];
var wheelF = [[0, 0], [0, 0]];
var wheelRotation = 0;

var pullForce = [0, 0];

var colPointsWorld = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
var colPointsV = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
var colPointsF = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];

var groundStep = .5;
var groundWidth = 0;
var ground = [];


function startGame() {
    init();
    gameLoop();
}

function init() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    // canvas.style.width = width + "px";
    // canvas.style.height = height + "px";
    // canvas.style.transform = 'scale(1,1)';

    backpic.src = 'images/clouds.png';
    carpic.src = 'images/car.png';
    wheelpic.src = 'images/wheel.png';
  
    window.addEventListener('resize', onWindowResize);
    window.addEventListener("keydown", function (event) { keyDownHandler(event) });
    window.addEventListener("keyup", function (event) { keyUpHandler(event) });
    setupMobile();

    loadLevel(1);

    frame();
}

function onWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
}

function setupMobile() {
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
}

function onTouchStart(evt) {
    setFullscreen();

    evt.preventDefault();
    const touches = evt.touches;
    for (let i = 0; i < touches.length; i++) {
        let x = Math.floor(touches[i].pageX);
        let y = Math.floor(touches[i].pageY);
        touchDown = true;
        touchX = x;
    }
}

function onTouchEnd(evt) {
    evt.preventDefault();
    touchDown = false;
}

function setFullscreen() {
    console.log('setFullscreen');
	
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

function keyDownHandler(ev) {
    if (ev.code === "Space") keySpace = true;
    else if (ev.code == "ArrowUp") keyUp = true;
    else if (ev.code == "ArrowDown") keyDown = true;
    else if (ev.code == "ArrowRight") keyRight = true;
    else if (ev.code == "ArrowLeft") keyLeft = true;
    else if (ev.code == "KeyF") drawForces = !drawForces;
    else if (ev.code == "KeyR") resetCar();
    else if (ev.code == "Digit1") loadLevel(1);
    else if (ev.code == "Digit2") loadLevel(2);
    else if (ev.code == "Digit3") loadLevel(3);
    else if (ev.code == "Digit4") loadLevel(4);
    else if (ev.code == "Digit5") loadLevel(5);
}

function keyUpHandler(ev) {
    if (ev.code === "Space") keySpace = false;
    else if (ev.code == "ArrowUp") keyUp = false;
    else if (ev.code == "ArrowDown") keyDown = false;
    else if (ev.code == "ArrowRight") keyRight = false;
    else if (ev.code == "ArrowLeft") keyLeft = false;
}

function frame() {

    handleTime();
    update(deltaTime);
    render();

    requestAnimationFrame(frame);
}

function handleTime() {
    fps++;
    var thisTick = new Date();
    var frametime = (thisTick - lastTick) * .001;
    if (frametime > .2) frametime = .2;
    lastTick = thisTick;

    if (!finished) {
        gameTime += frametime;
    }
    countTime += frametime;

    deltaTime = frametime;

    if (countTime >= 1) {
        // document.title = 'fps: ' + fps;
        lastFps = fps;
        // deltaTime = 1 / fps;
        fps = 0;
        countTime = 0;
    }
}


function update(dt) {

    if (mode == 0) {
        handleInput(dt);
        updateCar(dt);
    } else if (mode == 1) {
        updateTest(dt);
        // console.log(offset);
    }

    if (carX[0] > 495) {
        finished = true;
    }

    let d = (carX[0] - 4);
    offset += (d - offset) * dt * 4;
}

function updateTest(dt) {
    if (keyLeft) {
        carX[0] -= dt * 20;
    }
    if (keyRight) {
        carX[0] += dt * 20;
    }
}

function handleInput(dt) {

    if (touchDown) {
        if (!mobileControls) mobileControls = true;
    }
    if (mobileControls) {
        if (touchDown) {
            if (touchX >= width / 2) {
                keyRight = true;
            } else {
                keyLeft = true;
            }
        } else {
            keyRight = false;
            keyLeft = false;
        }
    }
    
    if (keyUp || keyRight) {
        gas += dt * 4;
        if (gas > 1) gas = 1;
    }
    if (keyDown || keyLeft) {
        gas -= dt * 4;
        if (gas < -1) gas = -1;
    }
    if (!(keyUp || keyDown || keyLeft || keyRight)) {
        if (gas > .1) gas -= dt * 4;
        else if (gas < -.1) gas += dt * 4;
        else gas = 0;
    }

    // if (keySpace) {
    //     pullForce[0] = 0;
    //     pullForce[1] = 50000;
    // } else {
    //     zero(pullForce);
    // }
}

function updateCar(dt) {
    
    // X += V * dt;
    carX[0] += carVelocity[0] * dt;
    carX[1] += carVelocity[1] * dt;
    
    // R += R * omega * dt;
    carR -= carAngularVelocity * dt;

    // reset if before start
    if (carX[0] < 3) {
        carX[0] = 3;
        zero(carVelocity);
    }

    carUp[0] = Math.sin(carR);
    carUp[1] = Math.cos(carR);
    carForward[0] = carUp[1];
    carForward[1] = -carUp[0];

    carAngularTorque = 0;
    zero(carForce);
    zero(carAcceleration);

    carForce[1] += carMass * -9.81;

    carSpeed = length(carVelocity);

    handleSuspension(dt);
    handleWheels(dt);
    handleCollisions(dt);
    handleResistance(dt);

    addForceAt(pullForce, wheelX[0]);

    // A = F / M
    carAcceleration[0] = carForce[0] / carMass;
    carAcceleration[1] = carForce[1] / carMass;

    // V += A * dt;
    carVelocity[0] += carAcceleration[0] * dt;
    carVelocity[1] += carAcceleration[1] * dt;

    // omega += (T / I) * dt
    carAngularVelocity += (carAngularTorque / carAngularInertia) * dt;

    carAngularVelocity *= .999;
    multiply(carVelocity, .999);
}

function resetCar() {
    gameTime = 0;
    finished = false;
    carX[0] = 4;
    carX[1] = 4;
    zero(carVelocity);
    carAngularVelocity = 0;
    carR = 0;
}

function handleResistance(dt) {
    copy(carVelocity, carResistanceF);
    if (carSpeed > .0001) {
        divide(carResistanceF, -carSpeed);
        var r = 1 * carSpeed * carSpeed;
        // for (i = 0; i < wheelAttach.length; i++) r += wheelP[i] * carSpeed * .005;
        multiply(carResistanceF, r);
        add(carResistanceF, carForce);
    } else {
        zero(carResistanceF);
    }
}

function handleSuspension(dt) {

    for (i = 0; i < wheelAttach.length; i++) {

        zero(wheelSuspension[i]);

        localToWorld(wheelAttach[i], wheelX[i]);
        moveDown(wheelX[i], .5);

        let h1 = getGroundHeight(wheelX[i][0]);
        if (wheelX[i][1] < h1) {
            springCompression[i] = h1 - wheelX[i][1];
            // if (springCompression[i] > .4) springCompression[i] = .4;
            let fs = springConstant * springCompression[i];

            let fd = dampConstant * (springCompression[i] - lastSpringCompression[i]) / dt;
            lastSpringCompression[i] = springCompression[i];

            let f = fs + fd;
    
            if (f > 0) {
                getGroundNormal(wheelX[i][0], wheelN[i]);
                copy(wheelN[i], wheelSuspension[i]);
                multiply(wheelSuspension[i], f);
            } else {
                f = 0;
            }

            wheelP[i] = f;
        } else {
            springCompression[i] = 0;
            wheelP[i] = 0;
        }

        addForceAt(wheelSuspension[i], wheelX[i]);
    }
}

function handleWheels(dt) {

    let mf = maxDrive;

    for (i = 0; i < wheelAttach.length; i++) {
        zero(wheelF[i]);
    }

    if (gas > .1 || gas < -.1) {
        for (i = 0; i < wheelAttach.length; i++) {
            var d = wheelP[i] * gas;
            if (d > mf) d = mf;
            wheelF[i][0] = wheelN[i][1] * d;
            wheelF[i][1] = -wheelN[i][0] * d;
        }
    }

    var forwardSpeed = dot(carVelocity, carForward);
    wheelRotation += forwardSpeed * .025;

    for (i = 0; i < wheelAttach.length; i++) {
        addForceAt(wheelF[i], wheelX[i]);
    }
}

function handleCollisions(dt) {
    for (i = 0; i < colPoints.length; i++) {
        localToWorld(colPoints[i], colPointsWorld[i]);
        getPointVelocity(colPointsWorld[i], colPointsV[i]);

        var x = colPointsWorld[i][0];
        var y = colPointsWorld[i][1];
        var h = getGroundHeight(x);
        if (y < h) {
            getGroundNormal(x, colPointsF[i]);
            var d = (h - y) * colsf;
            multiply(colPointsF[i], d);

            var fx = colPointsV[i][0] * -coldf;
            var fy = colPointsV[i][1] * -coldf;

            colPointsF[i][0] += fx;
            colPointsF[i][1] += fy;

            addForceAt(colPointsF[i], colPointsWorld[i]);
        } else {
            zero(colPointsF[i]);
        }
    }
}

function addForceAt(force, pos) {
    let d = [0, 0], dp = [0, 0];

    diff(d, pos, carX);
    let dlen = length(d);

    if (dlen > .001) {
        dp[0] = d[1] / dlen;
        dp[1] = -d[0] / dlen;

        let dotfd = dot(force, dp);
        carAngularTorque += dotfd * dlen;
    }

    add(force, carForce);
}

function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#53B4DA'; // '#0094FF';
    ctx.fillRect(0, 0, width, height);

    let sx = Math.floor(offset * -10.5) % 1000;

    ctx.drawImage(backpic, sx, 0);
    ctx.drawImage(backpic, sx + 1000, 0);
    ctx.drawImage(backpic, sx + 2000, 0);

    if (mode == 0) drawCar();
    drawGround();

    if (drawForces) {
        drawPoint(carX);
        drawLine(carX, carResistanceF, .0001, '#0000ff');

        for (i = 0; i < colPoints.length; i++) {
            drawPoint(colPointsWorld[i]);
            drawLine(colPointsWorld[i], colPointsF[i], .0001, '#ffff00');
        }

        drawLine(wheelX[0], pullForce, .0001, '#0000ff');

        for (i = 0; i < wheelAttach.length; i++) {
            drawLine(wheelX[i], wheelF[i], .0001, '#ff0000');
            drawLine(wheelX[i], wheelSuspension[i], .0001, '#00ff00');
        }
    }
    
    ctx.font = "32px Verdana";
    ctx.fillStyle = '#FFFF00';
    var kph = carSpeed * 3600 / 1000;
    var mph = kph / 1.6;
    ctx.fillText("Time: " + gameTime.toFixed(2) + " speed: " + mph.toFixed(0) + " mph", 10, 50);

    ctx.font = "14px Verdana";
    ctx.fillStyle = '#FFFF00';
    ctx.fillText("Use arrow keys to drive, R to reset. fps: " + lastFps + " canvas: " + width + ", " + height, 10, height - 4);
}

function loadLevel(lvl) {
    levelpic.src = 'images/level' + lvl + '.png?t=' + Date.now();
    levelpic.onload = function() {
        createGround();
        resetCar();
    };
}

function createGround() {

    var canvas = document.createElement('canvas');
    canvas.width = levelpic.width;
    canvas.height = levelpic.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(levelpic, 0, 0);
    var pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    groundWidth = levelpic.width;

    for (x = 0; x < groundWidth; x++) {
        var y = 0;

        var gx = x;
        for (gy = 0; gy < levelpic.height; gy++) {
            var idx = (gy * levelpic.width + gx) * 4;
            var green = pixelData[idx + 1];

            if (green != 0) {
                y = (levelpic.height - gy) * .12 + 1;
                break;
            }
        }

        ground[x] = y;
    }
}

function getGroundHeight(x) {
    let i = Math.floor(x / groundStep);
    let r = (x / groundStep) - i;
    return ground[i] + r * (ground[i + 1] - ground[i]);
}

function getGroundNormal(x, n) {
    let i = Math.floor(x / groundStep);
    let j = i + 1;
    
    let d = [groundStep, ground[j] - ground[i]];
    normalize(d);
    n[0] = -d[1];
    n[1] = d[0];
}

function zero(a) {
    a[0] = 0;
    a[1] = 0;
}

function localToWorld(p, w) {
    w[0] = carX[0] + p[0] * carForward[0] + p[1] * carUp[0];
    w[1] = carX[1] + p[1] * carUp[1] + p[0] * carForward[1];
}

function getPointVelocity(p, v) {
    let dx = p[0] - carX[0];
    let dy = p[1] - carX[1];
    v[0] = carVelocity[0] - (dy * carAngularVelocity);
    v[1] = carVelocity[1] + (dx * carAngularVelocity);
}

function moveDown(p, a) {
    p[0] -= carUp[0] * a;
    p[1] -= carUp[1] * a;
}

function dot(a, b) {
    return (a[0] * b[0] + a[1] * b[1]);
}

function cross(a, b) {
    return (a[0] * b[1] - a[1] * b[0]);
}

function diff(d, a, b) {
    d[0] = b[0] - a[0];
    d[1] = b[1] - a[1];
}

function normalize(d) {
    let len = length(d);
    d[0] /= len;
    d[1] /= len;
}

function multiply(d, n) {
    d[0] *= n;
    d[1] *= n;
}

function divide(d, n) {
    d[0] /= n;
    d[1] /= n;
}

function add(d, a) {
    a[0] += d[0];
    a[1] += d[1];
}

function copy(s, d) {
    d[0] = s[0];
    d[1] = s[1];
}
function length(d) {
    return Math.sqrt(d[0] * d[0] + d[1] * d[1]);
}

function drawLine(x, a, scale, color = '#ff0000') {
    ctx.beginPath();
    ctx.moveTo(factor * -offset + factor * x[0], height - (factor * x[1]));
    ctx.lineTo(factor * -offset + factor * x[0] + factor * a[0] * scale, height - (factor * x[1] + factor * a[1] * scale));
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawCar() {
    ctx.save();
    ctx.translate(factor * -offset + (factor * carX[0]), height - (factor * carX[1]));
    ctx.rotate(carR);
    ctx.drawImage(carpic, -100, -56);

    for (i = 0; i < wheelAttach.length; i++) {
        ctx.save();
        var sc = springCompression[i];
        if (sc > .4) sc = .4;
        ctx.translate(factor * wheelAttach[i][0], factor * -(wheelAttach[i][1] + sc));
        ctx.rotate(wheelRotation);
        ctx.drawImage(wheelpic, -21, -21);
        ctx.restore();
    }

    ctx.restore();
}

function drawGround() {

    ctx.fillStyle = "#404040";
    ctx.fillRect(0, height - 20, width, 20);

    var idx = Math.floor(offset / groundStep) + 0;
    var max = width / (36 * groundStep) + 1;

    for (let i = 0; i < max; i++) {
        if (idx >= ground.length - 1) continue;

        var h1 = ground[idx];
        var h2 = ground[idx + 1];
        var h = h1;
        if (h2 < h) h = h2;

        var left = factor * -offset + factor * idx * groundStep;
        var top = (factor * h);

        ctx.fillStyle = "#7C643A";
        ctx.fillRect(left, height - top, 18, top - 20);

        // for (j = 0; j < 4; j++) {
        //     var hh = h1 + (h2 - h1) * (j / 4);
        //     top = (factor * hh);
        //     ctx.fillRect(left + j * 9, height - top, 8, top - 20);
        // }
        
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(left, height - (factor * h1) + 15);
        ctx.lineTo(left + factor * groundStep, height - (factor * h2) + 15);
        ctx.strokeStyle = '#307A35';
        ctx.lineWidth = 30;
        ctx.stroke();

        ctx.restore();
        idx++;
    }

    return;

    ctx.save();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(factor * -offset, height - (factor * ground[0]) + 30);
    for (let i = 1; i < groundWidth; i++) {
        ctx.lineTo(factor * -offset + factor * i, height - (factor * ground[i]) + 30);
    }
    ctx.strokeStyle = '#307A35';
    ctx.lineWidth = 20;
    ctx.stroke();
    ctx.restore();
}

function drawPoint(x) {
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(factor * -offset + factor * x[0] - 2, height - (factor * x[1]) - 2, 4, 4);
}

init();