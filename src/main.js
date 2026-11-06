import * as THREE from 'three';
import './style.css'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let width = window.innerWidth
let height = window.innerHeight
let previousT = 0;
// everything that has to do with Three js and the visual state/drawing

let renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let povcamera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let grid = new THREE.GridHelper(100,20)
let axes = new THREE.AxesHelper()
let ambient = new THREE.AmbientLight("white")
const controls = new OrbitControls( povcamera, renderer.domElement );


camera.position.set(0,1,1.1)
camera.lookAt(0,0,-.9)
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
    dt: 1/120,
    gravity: -9.81,
    mass: 150,
    maxThrottle:3000, // in Newton

    airDrag:2,
}

let Cart = function(mass,mesh){
    this.mesh = mesh
    this.mass = mass
    this.vx = 0.0,this.x = 0
    this.vz = 0.0, this.z = 0
    this.yaw = 0
    this.motorForce = new THREE.Vector3(0,0,0)
}

Cart.prototype.calcuateNetforce = function() {
    // this.netForce = this.forces.reduce((value,nextValue)=>{
    //     return new THREE.Vector3(value.x +nextValue.x,value.y + nextValue.y,value.z+nextValue.z)
    // })
}
Cart.prototype.updateAcceleration = function() {
    this.ax = this.netForce.x / this.mass;
    this.az= this.netForce.z / this.mass;
}





let ccBody = new Body(1500,ccScene)

requestAnimationFrame(animate)
function animate(time) {    
    let deltaTime =  (time / 1000 - previousT).toFixed(3)
    previousT = time / 1000
    // ccBody.calcuateNetforce()
    // ccBody.updateAcceleration()
    // ccBody.vx += ccBody.ax * +deltaTime;
    // ccBody.vz += ccBody.az * +deltaTime;
    cccGroup.position.x += ccBody.vx * +deltaTime;
    cccGroup.position.z += ccBody.vz * +deltaTime;
	controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}

// Player Controls

let lastKeyStroke
let isHoldingKey = false
let intervalHandlerID
window.addEventListener('keydown',(e)=>{
    if(e.code == "KeyW"){
        isHoldingKey = true
        intervalHandlerID = setInterval(()=>{
            if (ccBody.vz < 3){
                ccBody.vz += 0.1
            }
        },1)
    }
    if(e.code == "KeyS"){
        intervalHandlerID = setInterval(()=>{
            ccBody.vz -= 0.1
        },1)
    }
    lastKeyStroke = e.code
})
window.addEventListener('keyup',(e)=>{
    isHoldingKey = false
    if(e.code == "KeyW"){
        clearInterval(intervalHandlerID)
    }
    if(e.code == "KeyS"){
        clearInterval(intervalHandlerID)
    }
    lastKeyStroke = e.code
})


