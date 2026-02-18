import * as THREE from 'three'
import * as utils from './utils'
import './routes/about'
import './routes/contact'
import './routes/projects'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats.js';
import fshGrassText from './shaders/grass_fragment_shader.glsl?raw';
import vshGrassText from './shaders/grass_vertex_shader.glsl?raw';
import fshGroundText from './shaders/ground_fragment_shader.glsl?raw';
import vshGroundText from './shaders/ground_vertex_shader.glsl?raw';
import getAboutMePage from './routes/about'
import getProjectsPage from './routes/projects'
import getContactPage from './routes/contact'

var stats = new Stats();
//stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
//document.body.appendChild(stats.dom);



const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
const screenSizes = {
     width: window.innerWidth,
     height: window.innerHeight
};
renderer.setSize(screenSizes.width, screenSizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickable = [];

const GRASS_SEGMENTS = 5;
const GRASS_PATCH_SIZE = 300;
const GRASS_WIDTH = 0.75;
const GRASS_HEIGHT = 4.5;
const NUM_GRASS = GRASS_PATCH_SIZE * GRASS_PATCH_SIZE * 3;





function createGeometry(segments) {
     const VERTICES = (segments + 1) * 2;
     const indeces = new Array(segments * 12);

     for (let i = 0; i < segments; i++) {
          const vi = i * 2;
          indeces[i * 12 + 0] = vi + 0;
          indeces[i * 12 + 1] = vi + 1;
          indeces[i * 12 + 2] = vi + 2;

          indeces[i * 12 + 3] = vi + 2;
          indeces[i * 12 + 4] = vi + 1;
          indeces[i * 12 + 5] = vi + 3;

          const fi = VERTICES + vi;
          indeces[i * 12 + 6] = fi + 2;
          indeces[i * 12 + 7] = fi + 1;
          indeces[i * 12 + 8] = fi + 0;

          indeces[i * 12 + 9] = fi + 3;
          indeces[i * 12 + 10] = fi + 1;
          indeces[i * 12 + 11] = fi + 2;
     }

     const geometry = new THREE.InstancedBufferGeometry();
     geometry.instanceCount = NUM_GRASS;
     geometry.setIndex(indeces);
     geometry.boundingSphere = new THREE.Sphere(
          new THREE.Vector3(0, 0, 0),
          1 + GRASS_PATCH_SIZE * 2);

     return geometry;
};

//Make ground
const terrainDiffuse = new THREE.TextureLoader().load('/terrainTexture/Terrain_Texture_BaseColor.png');
terrainDiffuse.wrapS = THREE.RepeatWrapping;
terrainDiffuse.wrapT = THREE.RepeatWrapping;
const groundMaterial = new THREE.ShaderMaterial({
     uniforms: {
          uTerrainTexture: { value: terrainDiffuse },
          uTileScale: { value: 30.0 }
     },
     vertexShader: vshGroundText,
     fragmentShader: fshGroundText
});
//const groundMaterial = new THREE.MeshBasicMaterial();
const groundGeometry = new THREE.PlaneGeometry(GRASS_PATCH_SIZE * 2, GRASS_PATCH_SIZE * 2, 512, 512);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotateX(-Math.PI / 2);
scene.add(ground);


//Make sky
const hdrLoader = new HDRLoader();
const envMap = await hdrLoader.loadAsync('/purenight.hdr');
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = envMap;
scene.background = envMap;
//scene.background *= 1.0;
scene.backgroundRotation.y += Math.PI ;

//Make grass
const uniforms = {
     grassParams: { value: new THREE.Vector4(GRASS_SEGMENTS, GRASS_PATCH_SIZE, GRASS_WIDTH, GRASS_HEIGHT) },
     time: { value: 0 },
     resolution: { value: new THREE.Vector2(1, 1) },
};
const grassMaterial = new THREE.ShaderMaterial({
     uniforms: uniforms,
     vertexShader: vshGrassText,
     fragmentShader: fshGrassText,
     side: THREE.FrontSide,
});

const grassGeometry = createGeometry(GRASS_SEGMENTS);
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
scene.add(grass);

//Make monolith
const monolithGeometry = new THREE.BoxGeometry(10, 75, 10);
const monolithMaterial = new THREE.MeshPhysicalMaterial({
     roughness: 1.0,
     color: new THREE.Color('white'),
})
const monolith = new THREE.Mesh(monolithGeometry, monolithMaterial)
//monolith.position.set(0, 0, 0)
monolith.rotation.x = 0.2
monolith.rotation.z = -0.2
monolith.rotation.y = 0.3
scene.add(monolith)
monolith.userData.clickable = true;
clickable.push(monolith)






const camera = new THREE.PerspectiveCamera(90, screenSizes.width / screenSizes.height, 0.1, 2000);
//const camera = new THREE.OrthographicCamera();
camera.position.set(0, 10, -310);
camera.lookAt(0, 0, 0); //position 0

//camera.position.set(380, 15, 260);
//camera.lookAt(0,-100, 0) //position 1
scene.add(camera);



const overlay = document.getElementById("overlay");
const dropdown = document.getElementById("dropdown");

const routes = {
     '#/': getAboutMePage,
     '#/projects': getProjectsPage,
     '#/contact': getContactPage
};


window.addEventListener("click", (event) => {

     if (overlay.contains(event.target) || dropdown.contains(event.target))
          return;
     // Convert mouse position to normalized device coordinates (-1 to +1)
     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

     raycaster.setFromCamera(mouse, camera);

     const intersects = raycaster.intersectObjects(clickable, true);

     if (intersects.length > 0) {
          const clickedObject = intersects[0].object;

          if (clickedObject.userData.clickable) {
               utils.showOverlay(event.clientX, event.clientY, clickedObject, overlay);
               utils.showOverlay(event.clientX, event.clientY, clickedObject, dropdown);
               return;
          }
     }
     utils.hideOverlay(overlay);
     utils.hideOverlay(dropdown);
});

function lerp(a, b, t) {
     return a + (b - a) * t;
}


let scrollValue = 0;

const scrollTarget = document.getElementById('webgl');
window.addEventListener("wheel", (event) => {
     if (event.target == scrollTarget) {     
     scrollValue += event.deltaY * 0.001;
     scrollValue = Math.min(Math.max(scrollValue, 0), 1);
     }
     else
          console.log("not in da div");
});

function handleRoute() {
     const hash = window.location.hash || '#/'; // Default to home if no hash
     const content = routes[hash] ? routes[hash]() : '<h1>Page Not Found</h1>';
     document.getElementById('overlay-content').innerHTML = content;
}

// Listen for navigation events
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

window.addEventListener('resize', () => {
     screenSizes.width = window.innerWidth;
     screenSizes.height = window.innerHeight;
     camera.aspect = screenSizes.width / screenSizes.height;
     camera.updateProjectionMatrix();
     renderer.setSize(screenSizes.width, screenSizes.height);
     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})


//const controls = new OrbitControls(camera, canvas);
//controls.target.set(0, 5, 0);

const clock = new THREE.Clock()

const tick = () => {
     stats.begin();
     const elapsedTime = clock.getElapsedTime();
     uniforms.time.value = elapsedTime;
     camera.fov = lerp(80, 100, scrollValue);
     camera.position.z = lerp(-310, 3, scrollValue);
     camera.position.x = lerp(0, -40, scrollValue);
     camera.rotation.y = lerp(0, -Math.PI / 4, scrollValue);
     camera.updateProjectionMatrix();
     //controls.update();
     const v = camera.position;
     console.log(
          `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`
     );
     renderer.render(scene, camera);
     stats.end();
     window.requestAnimationFrame(tick);

};
tick();