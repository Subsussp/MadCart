import * as THREE from 'three';
import './style.css'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls, PointerLockControls } from 'three/examples/jsm/Addons.js';
let width = window.innerWidth
let height = window.innerHeight
// everything that has to do with Three js and the visual state/drawing

let renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let povcamera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let grid = new THREE.GridHelper(200,100)
let axes = new THREE.AxesHelper()
let ambient = new THREE.AmbientLight("white")
const pcontrols = new OrbitControls( povcamera, renderer.domElement );
const controls = new PointerLockControls( camera, renderer.domElement );

camera.position.set(0,0.6,.11)
camera.lookAt(0,0.5,-.9)
povcamera.position.set(0,1,-0.1)
scene.add(grid)
scene.add(axes)
scene.add(ambient)

let dracoLoader = new DRACOLoader()
let loader = new GLTFLoader()
document.getElementById('app').appendChild(renderer.domElement)

dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
); 
loader.setDRACOLoader(dracoLoader);
let chelper = new THREE.CameraHelper(camera)

let data = await loader.loadAsync("/assets/Crazy_Cart.glb")
let crazyCart = data.scene
let cccGroup = new THREE.Group()

let ccScene = crazyCart
cccGroup.add(ccScene);
cccGroup.add(camera)
cccGroup.rotateOnWorldAxis(new THREE.Vector3(0,1,0),Math.PI)
scene.add(cccGroup)
scene.add(chelper)
scene.add(povcamera)

// everything is in SI units

let CFG = {
    dt: 1 / 120 * 1000, // this is in ms
    gravity: -9.81,
    mass: 150,
    maxThrottle:3000, // in Newton

    airDrag:2,
}

let Cart = function(mass,mesh){
    this.mesh = mesh
    this.mass = mass
    this.vx = 0.0,this.x = 0.0
    this.vz = 0.0, this.z = 0.0
    this.prevX = 0.0, this.prevZ = 0.0
    this.yaw = 0
    this.motorForce = new THREE.Vector3(0,0,0)
}

Cart.prototype.calcuateNetforce = function() {
    // this.netForce = this.forces.reduce((value,nextValue)=>{
    //     return new THREE.Vector3(value.x +nextValue.x,value.y + nextValue.y,value.z+nextValue.z)
    // })
}
Cart.prototype.updateAcceleration = function() {
}
function calcauteResultantVector(x,y){
    return Math.hypot(x,y)
}
Cart.prototype.calcuateDrag = function(drag){
    this.speed = calcauteResultantVector(this.vx,this.vz)
    Fx = -drag * this.speed * this.vx
    Fz = -drag * this.speed * this.vz
    return [Fx,Fz]
}


let ccBody = new Cart(1500,ccScene)

// THROTTLE USING TRACKPAD PRESSURE 
// let pressure = 0
// window.addEventListener('webkitmouseforcechanged', (event) => {
//     pressure = event.webkitForce
// });

function step(dt){
    let inputs = readInput()
    ccBody.vz = inputs.throttle && 1 / 120
    ccBody.prevX = ccBody.x
    ccBody.prevZ = ccBody.z

    ccBody.x += +ccBody.vx * dt
    ccBody.z += +ccBody.vz * dt

    
}

function draw(alpha){
    cccGroup.position.x += (ccBody.x - ccBody.prevX) * alpha;
    cccGroup.position.z += (ccBody.z - ccBody.prevZ) * alpha;

}


let accumulator = 0;let previousT = performance.now();
animate(previousT)
function animate(time) {    
    let deltaTime =  time - previousT
    accumulator += deltaTime
    while (accumulator>= CFG.dt){
        step(CFG.dt)
        accumulator -= CFG.dt
    }
    previousT = time 
    draw(accumulator / CFG.dt)

	controls.update();
	pcontrols.update();
    renderer.render(scene, camera);
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

})
window.addEventListener('keyup',(e)=>keys[e.code] = false)


function readInput(){
    return {throttle: keys.KeyW ? 1 : 0,steer: {},driftBar: !!keys.Space}
}