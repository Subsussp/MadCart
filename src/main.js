import * as THREE from 'three';
import './style.css'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

let width = window.innerWidth
let height = window.innerHeight
let throttle = 0
let steeringAngle = 0
// everything that has to do with Three js and the visual state/drawing
let gui = new dat.GUI({name:'Testing'})
let statusFolder = gui.addFolder('data')
let paramFolder = gui.addFolder('param')
statusFolder.open()

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
console.log(things)
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

    loadFront: 1/3,
    // loadFront: 0.470,
    // loadCaster: 0.265,
    loadCaster: 1/3,

    airDrag:2,
    staticFriction: 0.6,
    KineticFriction:0.4
}

let Cart = function(mass,mesh){
    this.mesh = mesh
    this.mass = mass


    this.vx = 0.0;this.x = 0.0
    this.vy = 0.0;this.y = 0.0
    this.vz = 0.0; this.z = 0.0
    this.az= 0.0
    this.prevX = 0.0;this.prevY = 0.0;this.prevZ = 0.0;
    this.yaw = 0;
    this.motorForce = new THREE.Vector3(0,0,0)
    this.parts =[new wheel(0.5,0.0964715,this.mass,103,CFG.loadFront), new wheel(0.2,0.037988,this.mass,0,CFG.loadCaster),new wheel(0.2,0.037988,this.mass,0,CFG.loadCaster)]
    
    // for drawing and better visuals
    this.HeadingVector = new THREE.Vector3(0,0,-1);
    this.SideVector = new THREE.Vector3(1,0,0);

}

let wheel = function(mass,radius,cartMass,maxTorque,loadDistruption){
    this.mass = mass
    this.radius = radius
    this.cartMass = cartMass

    this.isSlipping = false;
    this.maxStaticFrictionForce = ((this.cartMass + this.mass) * loadDistruption * -CFG.gravity) * CFG.staticFriction
    this.maxKineticFrictionForce = ((this.cartMass + this.mass) * loadDistruption * -CFG.gravity) * CFG.KineticFriction
    this.slipAngle = 0
    this.angularV = 0
    this.maxTorque = maxTorque 
    this.momentOfinertia = 1/2 * this.mass * radius * radius
}
wheel.prototype.updateSlipping = function () {
    if(this.maxTorque / this.radius * throttle > this.maxStaticFrictionForce){
        this.isSlipping = true
        // change to kintic friction
    }else if(this.isSlipping && (this.maxTorque / this.radius * throttle) <= this.maxKineticFrictionForce){
        this.isSlipping = false
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
function calcauteResultantVector(x,y){
    return Math.hypot(x,y)
}
function createHelperForVectors(start,end,color){
    let geometry  = new LineGeometry()
    geometry.setFromPoints([start,end])
    let headingHelper = new Line2(geometry,new LineMaterial({color:color,linewidth: 5}))
    cccGroup.add(headingHelper)
}
let ccBody = new Cart(159.7,ccScene)
// ccBody.prevY = 10
// ccBody.y = 10
// cccGroup.position.y = 10
let modelWheels = [ccScene.children[0].children[0].children[1]]
createHelperForVectors(new THREE.Vector3(0,0,0),ccBody.HeadingVector.multiplyScalar(5),"blue")
createHelperForVectors(new THREE.Vector3(0,0,0),ccBody.SideVector.multiplyScalar(5),"red")

const slippingState = {
    get Slipping() {
        return ccBody.parts.some(wheel => wheel.isSlipping);
    }
};
const throttleState = { throttle: 0 };
let throttleValue = statusFolder.add(throttleState, "throttle").step(0.001).listen();
let carVelocityValue = statusFolder.add(ccBody, "vz").step(0.001).listen();
let carAValue = statusFolder.add(ccBody, "az").step(0.001).listen();
let isSlipping = statusFolder.add(slippingState, "Slipping").listen();
isSlipping.domElement.style.pointerEvents = "none"
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
    let netForce = 0
    let restitanceLeftover = 0
    let wheelFrictionForce = 0

    // Calculating Traction Force generated by the friction of the wheels
    ccBody.parts.forEach((wheel)=>{
        wheel.updateSlipping()
        if(wheel.maxTorque === 0){
            restitanceLeftover += (wheel.momentOfinertia ) / (wheel.radius ** 2)
        }
        if(wheel.isSlipping){
            wheelFrictionForce+=  Math.min(wheel.maxTorque / wheel.radius * inputs.throttle,wheel.maxKineticFrictionForce)
        }else{
            wheelFrictionForce+= Math.min( wheel.maxTorque / wheel.radius * inputs.throttle , wheel.maxStaticFrictionForce)
        }
    })

    // calculating net force and accelration
    let [Fx,Fz] = ccBody.calcuateDrag(CFG.airDrag)
    netForce = wheelFrictionForce + Fz 
    let a = netForce / (ccBody.mass + restitanceLeftover ) * dt
    ccBody.az = netForce / (ccBody.mass + restitanceLeftover) 

    // Calculating angular Velocity for the wheels
    ccBody.parts.forEach((wheel)=>{
        if(wheel.isSlipping){
            wheel.angularV += - ((wheel.maxTorque * inputs.throttle - wheel.maxStaticFrictionForce * wheel.radius) / wheel.momentOfinertia) * dt
        }else{
            wheel.angularV = -ccBody.vz / wheel.radius * dt - (a / wheel.radius)
        }
    })
    ccBody.vz += a
    // ccBody.vz = inputs.throttle && 1 / 120
    ccBody.prevX = ccBody.x
    ccBody.prevY = ccBody.y
    ccBody.prevZ = ccBody.z
    steeringAngle > ccBody.yaw && (ccBody.yaw += steeringAngle * dt)
    ccBody.x += +ccBody.vx * dt; ccBody.y += +ccBody.vy * dt; ccBody.z += +ccBody.vz * dt

    
}

function draw(alpha){
    // Front wheel 
    modelWheels[0].rotation.x += ccBody.parts[0].angularV * alpha
    cccGroup.rotation.y += (ccBody.yaw - cccGroup.rotation.y) * alpha;
    // ccScene.children[2].rotation.y =  
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
    if(e.code == "KeyD"){
        steeringAngle+= 1 / 180 *Math.PI 
    }
})
window.addEventListener('keyup',(e)=>keys[e.code] = false)

function readInput(){
    throttleState.throttle = keys.KeyW ? (keys.KeyS ? (throttle - throttle / 2) : throttle) : 0
    return {throttle: keys.KeyW ? (keys.KeyS ? (throttle - throttle / 2) : throttle) : 0,steer: {},driftBar: !!keys.Space}
}