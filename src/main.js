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
const controls = new OrbitControls( camera, renderer.domElement );


let body = function(mesh){
    this.mesh = mesh
    this.position = new THREE.Vector3(0,0,0)
    this.velocity = new THREE.Vector3(0,0,0)
    this.accelration = new  THREE.Vector3(0,0,0)
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
let ccBody = new body(ccScene)


animate(0);

window.addEventListener('keydown',(e)=>{
    if(e.code == "KeyW"){
        ccBody.velocity.setZ(ccBody.velocity.z - 0.02)
        // ccBody.velocity.setZ(ccBody.velocity.z - 0.02)
    }
    if(e.code == "KeyS"){
        ccBody.velocity.setZ(ccBody.velocity.z + 0.02)
        // ccBody.velocity.setZ(ccBody.velocity.z + 0.02)
    }
    console.log(ccBody);
    
})
function animate(time) {    
    let deltaTime =  (time / 1000 - previousT).toFixed(3)
    previousT = time / 1000
    ccBody.velocity.addScaledVector(ccBody.accelration, deltaTime);
    ccScene.position.addScaledVector(ccBody.velocity,+deltaTime);
	controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);

}

