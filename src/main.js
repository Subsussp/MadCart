import * as THREE from 'three';
import './style.css'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import * as JXG from 'jsxgraph'

let width = window.innerWidth
let height = window.innerHeight
let throttle = 0
let steeringAngle = 0
let B = 10;
let C = 1.9;
let D = 0;
let E = 0.97;
// everything that has to do with Three js and the visual state/drawing
let gui = new dat.GUI({name:'Testing'})
let statusFolder = gui.addFolder('data')
let paramFolder = gui.addFolder('param')
statusFolder.open()

let board = JXG.JSXGraph.initBoard('jxgbox',{
    boundingBox: [-0.3,1000,0.3,-1000],
    axis:true,
    showNavigation:true,
    showCopyright:false
})
let xAxis = board.defaultAxes.x;
let yAxis = board.defaultAxes.y;
yAxis.defaultTicks.setAttribute({
    label: {
        strokeColor: 'white'
    }
});
xAxis.defaultTicks.setAttribute({
    label: {
        strokeColor: 'white'
    }
});
let point = board.create('point', [0, pacejka(0)], {
    name: 'P',
    size: 5,
    color: 'red'
});
let curve = board.create('functiongraph',[function(x){
    return pacejka(x)
},-0.3,0.3],{
    strokeColor: '#2196F3',
    strokeWidth:3
})
let renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let povcamera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let grid = new THREE.GridHelper(200,100)
let axes = new THREE.AxesHelper()
let sun = new THREE.DirectionalLight("white")
const pcontrols = new OrbitControls( povcamera, renderer.domElement );
const controls = new PointerLockControls( camera, renderer.domElement );
let roup = new THREE.Group()

let x = .252;
let z= 0.19;
let rayLen = .5
let points = [new THREE.Vector3(x,0.1,z),new THREE.Vector3(x ,-rayLen,z)]
let points2 = [new THREE.Vector3(-x - 0.016,0.1,z),new THREE.Vector3(-x - 0.016,-rayLen,z)]

let ray = new THREE.Raycaster(points[0],points[1],0,1.0)
let ray2 = new THREE.Raycaster(points2[0],points2[1],0,1.0)
// ray.setFromCamera(camera)
let buffer  =new THREE.BufferGeometry()
let buffer2  =new THREE.BufferGeometry()
buffer.setFromPoints(points)
buffer2.setFromPoints(points2)
let rayhelper = new THREE.Line(buffer,new THREE.LineBasicMaterial({color:"white"}))
let rayhelper2 = new THREE.Line(buffer2,new THREE.LineBasicMaterial({color:"white"}))
// roup.add(ray)

camera.position.set(0,0.6,.11)
camera.lookAt(0,0.5,-.9)
povcamera.position.set(0,1,-0.1)
scene.add(grid)
// scene.add(axes)
scene.add(sun)

let dracoLoader = new DRACOLoader()
let loader = new GLTFLoader()
document.getElementById('app').appendChild(renderer.domElement)
document.querySelector('.dg.ac').appendChild(gui.domElement)

dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
); 
loader.setDRACOLoader(dracoLoader);
let chelper = new THREE.CameraHelper(camera)

// let data = await loader.loadAsync("/assets/Crazy_Cart.glb")
let data = await loader.loadAsync("/assets/redCartv5.glb")
let crazyCart = data.scene
let cccGroup = new THREE.Group()

let box = new THREE.Box3().setFromObject(crazyCart)
let boxhelper = new THREE.Box3Helper(box,new THREE.Color('yellow')) 
let things = new THREE.Vector3()
box.getSize(things)
let ccScene = crazyCart
cccGroup.add(boxhelper);
cccGroup.add(ccScene);
cccGroup.add(camera)
cccGroup.rotateOnWorldAxis(new THREE.Vector3(0,1,0),Math.PI)
cccGroup.add(rayhelper)
cccGroup.add(rayhelper2)

scene.add(cccGroup)
// scene.add(chelper)
scene.add(povcamera)

// everything is in SI units

let CFG = {
    dt: 1 / 120 * 1000, // this is in ms
    gravity: -9.81,
    mass: 150,
    // maxTorqu:3800, // in Newton

    // loadFront: 1/3,
    loadFront: 0.470,
    loadCaster: 0.265,
    // loadCaster: 1/3,

    airDrag:2,
    staticFriction: 0.9,
    KineticFriction:0.7
}

let Cart = function(mass,mesh){
    this.mesh = mesh
    this.mass = mass


    this.vx = 0.0;this.x = 0.0
    this.vy = 0.0;this.y = 0.0
    this.vz = 0.0; this.z = 0.0
    this.az= 0.0
    this.prevX = 0.0;this.prevY = 0.0;this.prevZ = 0.0;
    this.prevYaw = 0;this.yaw = 0
    this.motorForce = new THREE.Vector3(0,0,0)
    this.parts =[new wheel(0.5,0.09647,this.mass,103,CFG.loadFront), new wheel(0.2,0.037988,this.mass,0,CFG.loadCaster),new wheel(0.2,0.037988,this.mass,0,CFG.loadCaster)]
    
    // for drawing and better visuals
    this.HeadingVector = new THREE.Vector3(0,0,-1);
    this.SideVector = new THREE.Vector3(1,0,0);

}

let wheel = function(mass,radius,cartMass,maxTorque,loadDistruption){
    this.mass = mass
    this.radius = radius
    this.cartMass = cartMass

    this.angle = 0;this.prevAngle = 0;
    this.isSliding = false;
    this.maxStaticFrictionForce = ((this.cartMass + this.mass) * loadDistruption * -CFG.gravity) * CFG.staticFriction;
    this.maxKineticFrictionForce = ((this.cartMass + this.mass) * loadDistruption * -CFG.gravity) * CFG.KineticFriction;
    this.prevAngularV = 0;
    this.slipAngle = 0
    this.slipRatio = 0
    this.angularV = 0
    this.maxTorque = maxTorque 
    this.momentOfinertia = 1/2 * this.mass * radius * radius
}
wheel.prototype.updateSlipping = function (throttle) {

    if(this.maxTorque / this.radius * throttle > this.maxStaticFrictionForce){
        this.isSliding = true
        // change to kintic friction
    }else if(this.isSliding && (this.maxTorque / this.radius * throttle) <= this.maxStaticFrictionForce){
        this.isSliding = false
    }
}

Cart.prototype.updateAcceleration = function() {

}

Cart.prototype.calcuateDrag = function(drag){
    this.speed = calcauteResultantVector(this.vx,this.vz)
    let Fx = -drag * this.speed * this.vx
    let Fz = -drag * this.speed * this.vz
    return [Fx,Fz]
}
// Math Functions
function calcauteResultantVector(x,y){
    return Math.hypot(x,y)
}
function pacejka(x){
    return D * Math.sin(C * Math.atan(B*x-E * (B*x-Math.atan(B*x))))
}
function createHelperForVectors(start,end,color,parent = cccGroup){
    let geometry  = new LineGeometry()
    geometry.setFromPoints([start,end])
    let headingHelper = new Line2(geometry,new LineMaterial({color:color,linewidth: 5}))
    parent.add(headingHelper)
    return headingHelper
}
let ccBody = new Cart(159.7,ccScene)
// ccBody.prevY = 10
// ccBody.y = 10
// cccGroup.position.y = 10
let modelWheels = [ccScene.children[0].children[0].children[1]]
createHelperForVectors(new THREE.Vector3(0,0,0),ccBody.HeadingVector.multiplyScalar(5),"blue")
createHelperForVectors(new THREE.Vector3(0,0,0),ccBody.SideVector.multiplyScalar(5),"red")

let fwd = createHelperForVectors(new THREE.Vector3(0,0,0),ccBody.HeadingVector.multiplyScalar(5),"yellow",ccScene.children[0].children[0])
createHelperForVectors(new THREE.Vector3(0,0,0),ccBody.SideVector.multiplyScalar(5),"green",ccScene.children[0].children[0])

let forceResultant = createHelperForVectors(new THREE.Vector3(ccScene.children[0].children[0].position.x,0,ccScene.children[0].children[0].position.z),ccBody.HeadingVector.multiplyScalar(5),"cyan",ccScene.children[0].children[0])
let speedResultant = createHelperForVectors(new THREE.Vector3(ccScene.children[0].children[0].position.x,0,ccScene.children[0].children[0].position.z),ccBody.HeadingVector.multiplyScalar(5),"#FF9100",ccScene.children[0].children[0])
const slippingState = {
    get Slipping() {
        return ccBody.parts.some(wheel => wheel.isSliding);
    }
};
const throttleState = { throttle: 0 };
let throttleValue = statusFolder.add(throttleState, "throttle").step(0.001).listen();
let carVelocityValue = statusFolder.add(ccBody, "vz").step(0.001).listen();
let carAValue = statusFolder.add(ccBody, "az").step(0.001).listen();
let isSliding = statusFolder.add(slippingState, "Slipping").listen();
isSliding.domElement.style.pointerEvents = "none"
throttleValue.domElement.style.pointerEvents = "none"


// THROTTLE USING TRACKPAD PRESSURE 
// let pressure = 0
// window.addEventListener('webkitmouseforcechanged', (event) => {
//     pressure = event.webkitForce
// });

function checkCollision(){
    
}

function step(dt){
    let inputs = readInput()
    checkCollision()
    if(ccBody.y > 0){
        ccBody.vy += (CFG.gravity) * dt
    }else{
        ccBody.vy = 0
    }
    let FznetForce = 0
    let FxnetForce = 0
    let netForce = 0
    let restitanceLeftover = 0
    let FzwheelFrictionForce = 0
    let FxwheelFrictionForce = 0

    // Calculating Traction Force generated by the friction of the wheels
    ccBody.parts.forEach((wheel)=>{
        wheel.updateSlipping(inputs.throttle)
        if(wheel.maxTorque === 0){
            restitanceLeftover += (wheel.momentOfinertia ) / (wheel.radius ** 2)
        }
        if(wheel.isSliding){
            let alpha = ((wheel.maxTorque * inputs.throttle - wheel.maxKineticFrictionForce * wheel.radius) / wheel.momentOfinertia)
            wheel.angularV += -alpha * dt
            wheel.slipRatio = -wheel.angularV * wheel.radius / (ccBody.vz || 1) - 1
            D = wheel.maxKineticFrictionForce
            let traction = pacejka(wheel.slipAngle)
            console.log(wheel.slipAngle);
            
            point.moveTo([wheel.slipRatio,])

            let resultantForce =  Math.min(wheel.maxTorque / wheel.radius * inputs.throttle,wheel.maxKineticFrictionForce)
            FzwheelFrictionForce +=  traction
            FxwheelFrictionForce +=  resultantForce * Math.sin(ccBody.yaw)
        }else{
            let resultantForce =  Math.min( wheel.maxTorque / wheel.radius * inputs.throttle , wheel.maxStaticFrictionForce)
            FzwheelFrictionForce += resultantForce * Math.cos(ccBody.yaw)
            FxwheelFrictionForce += resultantForce * Math.sin(ccBody.yaw)
        }
    })

    // calculating net force and accelration
    let [Fx,Fz] = ccBody.calcuateDrag(CFG.airDrag)
    FznetForce = FzwheelFrictionForce + Fz 
    FxnetForce = FxwheelFrictionForce + Fx 
    let az = FznetForce / (ccBody.mass + restitanceLeftover ) 
    let ax = FxnetForce / (ccBody.mass + restitanceLeftover ) 

    if(FxnetForce || FznetForce){
        let end = new THREE.Vector3(FxnetForce,0, FznetForce)
        end.applyQuaternion(ccScene.children[0].children[0].getWorldQuaternion(new THREE.Quaternion()).invert())
        let points = [
            new THREE.Vector3(0,0,0)
            ,
            end
        ]
        forceResultant.geometry.setFromPoints(points);
    }

    ccBody.az = az
    ccBody.vz += az * dt
    ccBody.vx += ax * dt
    if(ccBody.vx ||  ccBody.vz){
        let end = new THREE.Vector3(ccBody.vx,0, ccBody.vz)
        end.applyQuaternion(ccScene.children[0].children[0].getWorldQuaternion(new THREE.Quaternion()).invert())
        let points = [
            new THREE.Vector3(0,0,0)
            ,
            end
        ]
        speedResultant.geometry.setFromPoints(points);
    }
    // Calculating angular Velocity for the wheels
    ccBody.parts.forEach((wheel)=>{
        if(wheel.isSliding){

            
        }else{
            wheel.angularV += -az / wheel.radius * dt 
            wheel.slipRatio = -wheel.angularV * wheel.radius/ (ccBody.vz || 1)  - 1
        }
        wheel.prevAngle = wheel.angle
        wheel.angle += wheel.angularV * dt
    })

    // ccBody.vz = inputs.throttle && 1 / 120
    ccBody.prevX = ccBody.x
    ccBody.prevY = ccBody.y
    ccBody.prevZ = ccBody.z
    ccBody.prevYaw = ccBody.yaw
    ccBody.prevAngularV = ccBody.angularV
    
    ccBody.yaw += inputs.steer * 1/2 * Math.PI * dt;
    ccBody.x += +ccBody.vx * dt; ccBody.y += +ccBody.vy * dt; ccBody.z += +ccBody.vz * dt;

    
}

function draw(alpha){
    // Front wheel 
    modelWheels[0].rotation.x = ccBody.parts[0].prevAngle + ( ccBody.parts[0].angle - ccBody.parts[0].prevAngle) * alpha
    ccScene.children[0].children[0].rotation.y = ccBody.prevYaw + (ccBody.yaw - ccBody.prevYaw) * alpha
    cccGroup.position.x = ccBody.prevX + (ccBody.x - ccBody.prevX) * alpha;
    cccGroup.position.y = ccBody.prevY + (ccBody.y - ccBody.prevY) * alpha;
    cccGroup.position.z = ccBody.prevZ + (ccBody.z - ccBody.prevZ) * alpha;

}


let accumulator = 0;let previousT = performance.now();
animate(previousT)
function animate(time) {    
    let deltaTime =  time - previousT
    accumulator += deltaTime
    while (accumulator>= CFG.dt){
        step(CFG.dt / 1000)
        accumulator -= CFG.dt
    }
    previousT = time 
    draw(accumulator / CFG.dt)

	controls.update();
	pcontrols.update();
    renderer.render(scene, povcamera );
    requestAnimationFrame(animate);

}



window.addEventListener('mousedown',()=>{
    controls.isLocked = true
})

window.addEventListener('mouseup',()=>{
    controls.isLocked = false
})

// Player Controls

let keys = {}
window.addEventListener('keydown',(e)=>{
    keys[e.code] = true
    if(e.code == "KeyW"){
        throttle >= 1 ? (throttle = 1) : (throttle+= + 0.003)
    }
})
window.addEventListener('keyup',(e)=>{keys[e.code] = false
    if(e.code == "KeyW"){
        throttle = 0
    }
})

function readInput(){
    throttleState.throttle = keys.KeyW ? (keys.KeyS ? (throttle - throttle / 2) : throttle) : 0
    return {throttle: keys.KeyW ? (keys.KeyS ? (throttle - throttle / 2) : throttle) : 0,steer: (keys.KeyA ? 1 : 0)-  (keys.KeyD ? 1 :0),driftBar: !!keys.Space}
}