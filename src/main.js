import * as THREE from 'three';
import './style.css'
import * as CANNON from "cannon-es"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let width = window.innerWidth
let height = window.innerHeight

let renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)
let scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(75,width/height,0.1,1000)
let ambient = new THREE.AmbientLight("white")
const controls = new OrbitControls( camera, renderer.domElement );

camera.position.set(0,1,-0.1)
scene.add(camera)
scene.add(ambient)
let cannonWorld = new CANNON.World()
cannonWorld.gravity.set(0,0,-9.81)

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

let chassis = new CANNON.Body({
    mass: 150,
    shape: new CANNON.Box(
        new CANNON.Vec3(0.8, 0.3, 1.2)
    ),
    position: new CANNON.Vec3(0, 2, 0)

});
cannonWorld.addBody(chassis);

const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane()
});

groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

cannonWorld.addBody(groundBody);
animate();


function animate() {
    requestAnimationFrame(animate);

    // cannonWorld.fixedStep();

    // ccScene.position.copy(chassis.position);
    // ccScene.quaternion.copy(chassis.quaternion);
	controls.update();

    renderer.render(scene, camera);
}


