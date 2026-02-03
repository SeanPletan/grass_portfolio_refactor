import * as THREE from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats.js';
import fshGrassText from './shaders/grass_fragment_shader.glsl?raw';
import vshGrassText from './shaders/grass_vertex_shader.glsl?raw';
import fshGroundText from './shaders/ground_fragment_shader.glsl?raw';
import vshGroundText from './shaders/ground_vertex_shader.glsl?raw';

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);



const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
const screenSizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
renderer.setSize(screenSizes.width, screenSizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const GRASS_SEGMENTS = 5;
const GRASS_PATCH_SIZE = 400;
const GRASS_WIDTH = 0.75;
const GRASS_HEIGHT = 4.5;
const NUM_GRASS = GRASS_PATCH_SIZE * GRASS_PATCH_SIZE * 8;





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
const envMap = await hdrLoader.loadAsync('/puresky3_low.hdr');
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = envMap;
scene.background = envMap;

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
monolith.position.set(-25, 5, -0)
monolith.rotation.x = 0.0
monolith.rotation.z = -0.2
monolith.rotation.y = 0.0
scene.add(monolith)





const camera = new THREE.PerspectiveCamera(60, screenSizes.width / screenSizes.height, 0.1, 2000);
//const camera = new THREE.OrthographicCamera();
camera.position.set(0, 15, -390);
camera.lookAt(0,-80,0); //position 0

//camera.position.set(380, 15, 260);
//camera.lookAt(0,-100, 0) //position 1
scene.add(camera);


window.addEventListener('resize', () => {
    screenSizes.width = window.innerWidth;
    screenSizes.height = window.innerHeight;
    camera.aspect = screenSizes.width / screenSizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(screenSizes.width, screenSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
})


const controls = new OrbitControls(camera, canvas);
controls.target.set(-25,5,0);

const clock = new THREE.Clock()

const tick = () => {
    stats.begin();
    const elapsedTime = clock.getElapsedTime();
    uniforms.time.value = elapsedTime;
    controls.update();
    const v = camera.position;
    console.log(
    `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`
    );
    renderer.render(scene, camera);
    stats.end();
    window.requestAnimationFrame(tick);

};
tick();