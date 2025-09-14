import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import RAPIER, { RigidBodyDesc, RotationOps } from "@dimforge/rapier3d-compat";
import Car from "./Car";
import Debugger from "./Debugger";

await RAPIER.init();
const gravity = new THREE.Vector3(0, -9.81, 0);
const world = new RAPIER.World(gravity);
const dynamicBodies: [THREE.Mesh, RAPIER.RigidBody][] = [];

const scene = new THREE.Scene();

const rapierdebugger = new Debugger(scene, world);

const light1 = new THREE.SpotLight(undefined, Math.PI * 10);
light1.position.set(2.5, 5, 5);
light1.angle = Math.PI / 1.8;
light1.penumbra = 0.5;
light1.castShadow = true;
light1.shadow.blurSamples = 10;
light1.shadow.radius = 5;
scene.add(light1);

const light2 = light1.clone();
light2.position.set(-2.5, 5, 5);
scene.add(light2);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2, 5);

const cubeMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial()
);
cubeMesh.castShadow = true;
scene.add(cubeMesh);

const cubeBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(3, 3, 0).setCanSleep(false)
);

const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
  .setMass(1)
  .setRestitution(1.1);

world.createCollider(cubeShape, cubeBody);

dynamicBodies.push([cubeMesh, cubeBody]);

//Floor Cllider
const floorMesh = new THREE.Mesh(
  new THREE.BoxGeometry(50, 1, 50),
  new THREE.MeshPhongMaterial()
);
floorMesh.receiveShadow = true;
floorMesh.position.y = -1;
scene.add(floorMesh);

const floorBody = world.createRigidBody(
  RigidBodyDesc.fixed().setTranslation(0, -1, 0)
);

const floorShape = RAPIER.ColliderDesc.cuboid(25, 0.5, 25);
world.createCollider(floorShape, floorBody);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.y = 1;

const car = new Car(world);
await car.loadCar(scene, [0, 3, 0]);

const clock = new THREE.Clock();
let delta;

function animate() {
  requestAnimationFrame(animate);

  delta = clock.getDelta();
  world.timestep = Math.min(0.1, delta);
  world.step();

  for (let i = 0; i < dynamicBodies.length; i++) {
    dynamicBodies[i][0].position.copy(dynamicBodies[i][1].translation());
    dynamicBodies[i][0].quaternion.copy(dynamicBodies[i][1].rotation());
  }

  car.update();
  rapierdebugger.update();
  controls.update();

  renderer.render(scene, camera);
  delta = clock.getDelta();
}

animate();
