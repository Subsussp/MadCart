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
let ambient = new THREE.AmbientLight("white")
let gravity = 9.81
const controls = new OrbitControls( camera, renderer.domElement );


let body = function(mass,mesh){
    this.mesh = mesh
    this.mass = mass
    this.position = new THREE.Vector3(0,0,0)
    this.velocity = new THREE.Vector3(0,0,0)
    this.acceleration = new  THREE.Vector3(0,0,0)
    this.frictionForce = new THREE.Vector3(0,0,0)
    this.motorForce = new THREE.Vector3(0,0,0)
    this.netForce = new THREE.Vector3(0,0,0)
}

body.prototype.calcuateNetforce = function() {
    // this.netForce = this.forces.reduce((value,nextValue)=>{
    //     return new THREE.Vector3(value.x +nextValue.x,value.y + nextValue.y,value.z+nextValue.z)
    // })
    this.netForce = this.motorForce.add(this.frictionForce)
}
body.prototype.updateAcceleration = function() {
    this.acceleration.x = this.netForce.x / this.mass;
    this.acceleration.y = this.netForce.y / this.mass;
    this.acceleration.z = this.netForce.z / this.mass;
}
camera.position.set(0,1,-0.1)
scene.add(camera)
scene.add(ambient)

let dracoLoader = new DRACOLoader()
let loader = new GLTFLoader()
document.getElementById('app').appendChild(renderer.domElement)

dracoLoader.setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
); 
loader.setDRACOLoader(dracoLoader);


let data = await loader.loadAsync("/assets/Crazy_Cart.glb")
let crazyCart = data.scene
let ccScene = crazyCart
scene.add(ccScene);
console.log(scene)
let ccBody = new body(1000,ccScene)


animate(0);
window.addEventListener('keydown',(e)=>{
    if(e.code == "KeyW"){
        ccBody.motorForce.setZ(ccBody.motorForce.z + 0.04)
        ccBody.frictionForce.setZ((ccBody.mass * gravity * 0.8) > (ccBody.motorForce.z) ? -ccBody.motorForce.z : -(ccBody.mass * gravity * 0.8))
        // ccBody.velocity.setZ(ccBody.velocity.z - 0.02)
    }
    if(e.code == "KeyS"){
        ccBody.motorForce.setZ(ccBody.motorForce.z - 0.04)
        ccBody.frictionForce.setZ((ccBody.mass * gravity * 0.8) > (ccBody.motorForce.z) ? -ccBody.motorForce.z : -(ccBody.mass * gravity * 0.8))
        // ccBody.velocity.setZ(ccBody.velocity.z + 0.02)
    }
})
window.addEventListener('keyup',(e)=>{
    console.log(ccBody)
    console.log('now')
    console.log(e)
    ccBody.motorForce.setZ(0)

})

function animate(time) {    
    let deltaTime =  (time / 1000 - previousT).toFixed(3)
    previousT = time / 1000
    ccBody.calcuateNetforce()
    ccBody.updateAcceleration()
    ccBody.velocity.addScaledVector(ccBody.acceleration, +deltaTime);
    ccScene.position.addScaledVector(ccBody.velocity,+deltaTime);
	controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}

