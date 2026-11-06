import * as THREE from 'three';
import './style.css'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let width = window.innerWidth
let height = window.innerHeight
let previousT = 0;

let renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let povcamera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let grid = new THREE.GridHelper(100,20)
let axes = new THREE.AxesHelper()
let ambient = new THREE.AmbientLight("white")
let gravity = 9.81
const controls = new OrbitControls( povcamera, renderer.domElement );


let body = function(mass,mesh){
    this.mesh = mesh
    this.mass = mass
    this.vx = 0.0
    this.vz = 0.0
    this.position = new THREE.Vector3(0,0,0)
    this.ax = 0.0
    this.az = 0.0
    this.frictionForce = new THREE.Vector3(0,0,0)
    this.motorForce = new THREE.Vector3(0,0,0)
    this.netForce = new THREE.Vector3(0,0,0)
    this.maxThrottle = 3000
}

body.prototype.calcuateNetforce = function() {
    // this.netForce = this.forces.reduce((value,nextValue)=>{
    //     return new THREE.Vector3(value.x +nextValue.x,value.y + nextValue.y,value.z+nextValue.z)
    // })
}
body.prototype.updateAcceleration = function() {
    this.ax = this.netForce.x / this.mass;
    this.az= this.netForce.z / this.mass;
}
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
let ccBody = new body(1500,ccScene)


animate(0);
let lastKeyStroke
window.addEventListener('keydown',(e)=>{
    if(e.code == "KeyW"){
        ccBody.vz += 0.1
    }
    if(e.code == "KeyS"){
        ccBody.vz -= 0.1
    }
    lastKeyStroke = e.code
})


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

