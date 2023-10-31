

import * as THREE from 'three';


import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';











const loadingScreen = document.getElementById("loadingScreen");
const loadingProgress = document.getElementById("loadingProgress");
const loadingPercent = document.getElementById("loadingPercent");
const loadingFiles = document.getElementById("loadingFiles");

const manager = new THREE.LoadingManager();
manager.onStart = (url, itemsLoaded, itemsTotal) => {
    const progress = `${Math.floor((itemsLoaded / itemsTotal) * 100)}%`;
    [loadingProgress.style.width, loadingPercent.textContent] = [progress, `Loading... ${progress}`];
    loadingFiles.textContent = `${itemsLoaded} of ${itemsTotal} files loaded`;
};
manager.onLoad = () => loadingScreen.style.display = "none";
manager.onError = url => console.log(`Error loading: ${url}`);




const lightIntensity = 40;
const roomScale = 1;


//loaders
const dLoader = new DRACOLoader()
dLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
dLoader.setDecoderConfig({type: 'js'})

const gltfLoader = new GLTFLoader(manager)
gltfLoader.setDRACOLoader(dLoader)

const cubeTextureLoader = new THREE.CubeTextureLoader






const canvas = document.querySelector('#c');



const scene = new THREE.Scene();

const environmentMap = cubeTextureLoader.load([
    '/environmentMaps/2/px.png',
    '/environmentMaps/2/nx.png',
    '/environmentMaps/2/py.png',
    '/environmentMaps/2/ny.png',
    '/environmentMaps/2/pz.png',
    '/environmentMaps/2/nz.png',
])


scene.background = environmentMap

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
   
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

  
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

  
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math .min(window.devicePixelRatio, 2))
})

 


const camera = new THREE.PerspectiveCamera (50, window.innerWidth/ window.innerHeight , 0.1, 100);
camera.position.set(4 ,1.2, +2   )
  
scene.add(camera) 
 

const cursorGeometry = new THREE.RingGeometry(0.005, 0.001, 20);
const cursorMaterial = new THREE.MeshPhongMaterial({color: 0x000000, side: THREE.DoubleSide});
const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);

camera.add(cursor);
cursor.position.set(0, 0, -0.5);




const light1 = new THREE.AmbientLight( 0x404040, lightIntensity );

scene.add(light1);



const controls = new PointerLockControls(camera, canvas);
scene.add(controls.getObject());

const renderer  = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setSize(sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace



class JoystickController {
    constructor(stickID, maxDistance, deadzone) {
        this.id = stickID;
        let stick = document.getElementById(stickID);

        this.dragStart = null;

        this.touchId = null;

        this.active = false;
        this.value = { x: 0, y: 0 };

        let self = this;

        function handleDown(event) {
            self.active = true;

            stick.style.transition = '0s';

            event.preventDefault();

            if (event.changedTouches)
                self.dragStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
            else
                self.dragStart = { x: event.clientX, y: event.clientY };

            if (event.changedTouches)
                self.touchId = event.changedTouches[0].identifier;
        }

        function handleMove(event) {
            if (!self.active) return;

            let touchmoveId = null;
            if (event.changedTouches) {
                for (let i = 0; i < event.changedTouches.length; i++) {
                    if (self.touchId == event.changedTouches[i].identifier) {
                        touchmoveId = i;
                        event.clientX = event.changedTouches[i].clientX;
                        event.clientY = event.changedTouches[i].clientY;
                    }
                }

                if (touchmoveId == null) return;
            }

            const xDiff = event.clientX - self.dragStart.x;
            const yDiff = event.clientY - self.dragStart.y;
            const angle = Math.atan2(yDiff, xDiff);
            const distance = Math.min(maxDistance, Math.hypot(xDiff, yDiff));
            const xPosition = distance * Math.cos(angle);
            const yPosition = distance * Math.sin(angle);

            stick.style.transform = `translate3d(${xPosition}px, ${yPosition}px, 0px)`;

            const distance2 = (distance < deadzone) ? 0 : maxDistance / (maxDistance - deadzone) * (distance - deadzone);
            const xPosition2 = distance2 * Math.cos(angle);
            const yPosition2 = distance2 * Math.sin(angle);
            const xPercent = parseFloat((xPosition2 / maxDistance).toFixed(4));
            const yPercent = parseFloat((yPosition2 / maxDistance).toFixed(4));

            self.value = { x: xPercent, y: yPercent };
        }

        function handleUp(event) {
            if (!self.active) return;

            if (event.changedTouches && self.touchId != event.changedTouches[0].identifier) return;

            stick.style.transition = '.2s';
            stick.style.transform = `translate3d(0px, 0px, 0px)`;

            self.value = { x: 0, y: 0 };
            self.touchId = null;
            self.active = false;
        }

        stick.addEventListener('mousedown', handleDown);
        stick.addEventListener('touchstart', handleDown);
        document.addEventListener('mousemove', handleMove, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchend', handleUp);
    }
}

let joystick1 = new JoystickController("stick1", 64, 8);
let joystick2 = new JoystickController("stick2", 64, 8);

const clock = new THREE.Clock();
const timer = new THREE.Clock(false);


const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

const raycasterOrigin = new THREE.Vector3(0, 0, 0);
const raycasterDirection = new THREE.Vector3(0, 0, -1);
const raycaster = new THREE.Raycaster(raycasterOrigin, raycasterDirection, 0.1, 15);

function getForwardVector() {

    camera.getWorldDirection(playerDirection);
    playerDirection.normalize();

    let currentCameraPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
    raycaster.set(currentCameraPos, playerDirection);

    return playerDirection;

}

function getSideVector() {

    camera.getWorldDirection(playerDirection);
    playerDirection.normalize();
    playerDirection.cross(camera.up);

    return playerDirection;

}

function update(deltaTime) {
    const speed = 0.2;
    camera.rotation.y -= joystick2.value.x / 50
   
    getForwardVector();

    if (joystick1.value.y != 0) {
        playerVelocity.add(getForwardVector().multiplyScalar(speed * deltaTime * -joystick1.value.y));
    }

    if (joystick1.value.x != 0) {
        playerVelocity.add(getSideVector().multiplyScalar(speed * deltaTime * joystick1.value.x));
    }

    const damping = Math.exp(- 5 * deltaTime) - 1;
    playerVelocity.addScaledVector(playerVelocity, damping);

    camera.position.z += playerVelocity.z
    camera.position.x += playerVelocity.x
}



document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const overlay = document.getElementById('overlay');
    const fullscreenButton = document.getElementById('fullscreen');

    body.style.width = '100vw';
    body.style.height = '100vh';

    fullscreenButton.addEventListener('click', function () {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        overlay.style.display = 'none';
    });
});


gltfLoader.load( 'Android17.glb', function ( gltf ) {


  const root = gltf.scene;
  root.traverse((object) => {
  
});
   scene.add( root );
  root.position.set(0 , 0 , 0);


 root.rotation.y = Math.PI / 2;  
 
 

  let scale = roomScale;
  root.scale.set(scale+(scale*0.2), scale, scale+(scale*0.2));
  


  console.log("yy")
  console.log(root)
  
 console.log(root.children)

}, undefined, function ( error ) {

	console.error( error );    

});


 
 























function animate() {

    const deltaTime = Math.min(0.1, clock.getDelta());

    update(deltaTime);

    renderer.render(scene, camera);

    requestAnimationFrame(animate);

};

animate();



const onKeyDown = function ( event ) {

  switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
          moveForward = true;
          break;

      case 'ArrowLeft':
      case 'KeyA':
          moveLeft = true;
          break;

      case 'ArrowDown':
      case 'KeyS':
          moveBackward = true;
          break;

      case 'ArrowRight':
      case 'KeyD':
          moveRight = true;
          break;
      case 'Space':
          if(controls.isLocked){
              controls.unlock();
          } else {
              controls.lock();
          }
          break;
      }


  };

const onKeyUp = function ( event ) {

  switch ( event.code ) {
      case 'ArrowUp':
      case 'KeyW':
          moveForward = false;
          break;

      case 'ArrowLeft':
      case 'KeyA':
          moveLeft = false;
          break;

      case 'ArrowDown':
      case 'KeyS':
          moveBackward = false;
          break;

      case 'ArrowRight':
      case 'KeyD':
          moveRight = false;
          break;
  }
};

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );
window.addEventListener('click', () => {
    if (deviceControls) {
        deviceControls.connect();
    }
});







