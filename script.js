/*
 * Main logic for the Telegram 3D Plane Game.
 *
 * The game uses Three.js to create a simple 3D world in which the player
 * pilots a plane across an infinite landscape.  The plane continually
 * moves forward and responds to keyboard input to change its heading and
 * pitch.  Randomly generated mountains are repositioned when the plane
 * passes them, giving the illusion of an endless environment.  A camera
 * follows the plane from behind to provide a third‑person view.
 */

(() => {
  // Get the container element where we will insert the renderer's canvas.
  const container = document.getElementById('gameContainer');

  // Create the Three.js scene.  Fog adds depth to the environment.
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xa0a0a0, 50, 500);

  // Create the camera with a reasonably wide field of view.  The aspect
  // ratio will be updated on resize.  Near and far clipping planes are
  // chosen to encompass the game world.
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, -8);

  // Create the WebGL renderer.  Antialiasing improves the quality of
  // edges.  The pixel ratio is matched to the device's for retina displays.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lighting: a hemisphere light simulates diffused sky lighting and a
  // directional light simulates sunlight.  Adjust intensities to taste.
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, -5);
  scene.add(dirLight);

  // Load textures for the environment and plane.  A TextureLoader is used to
  // asynchronously load image files from the textures folder.  The sky texture
  // is applied to the scene background, while the grass, mountain and fuselage
  // textures are used on geometry materials.  Repeat wrapping on the grass
  // texture enables tiling across the large ground plane.
  const loader = new THREE.TextureLoader();
  const skyTexture = loader.load('textures/sky.png');
  scene.background = skyTexture;
  const grassTexture = loader.load('textures/grass.png');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(100, 100);
  const mountainTexture = loader.load('textures/mountain.png');
  mountainTexture.wrapS = mountainTexture.wrapT = THREE.RepeatWrapping;
  mountainTexture.repeat.set(1, 1);
  const fuselageTexture = loader.load('textures/fuselage.png');
  fuselageTexture.wrapS = THREE.RepeatWrapping;
  fuselageTexture.wrapT = THREE.ClampToEdgeWrapping;
  // Repeat the windows around the cylinder a few times to fill the fuselage.
  fuselageTexture.repeat.set(4, 1);

  // Ground plane: represents the earth.  Use the grass texture for realism.
  // The plane is rotated so that its surface lies in the XZ plane.
  const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
  const groundMaterial = new THREE.MeshLambertMaterial({ map: grassTexture });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  scene.add(ground);

  // Create a detailed airplane model with Phong materials for realism.
  const plane = new THREE.Group();
  // Materials.  The fuselage uses a texture with windows; other parts use
  // tinted materials with specular highlights.
  const bodyMaterial = new THREE.MeshPhongMaterial({
    map: fuselageTexture,
    specular: 0x666666,
    shininess: 50
  });
  const accentMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    specular: 0x555555,
    shininess: 20
  });
  const engineMaterial = new THREE.MeshPhongMaterial({
    color: 0x666666,
    specular: 0x333333,
    shininess: 10
  });
  // Fuselage
  const fuselageGeom2 = new THREE.CylinderGeometry(0.3, 0.3, 8, 32);
  const fuselage2 = new THREE.Mesh(fuselageGeom2, bodyMaterial);
  fuselage2.rotation.z = Math.PI / 2;
  plane.add(fuselage2);
  // Nose
  const noseGeom2 = new THREE.ConeGeometry(0.3, 1.0, 32);
  const nose2 = new THREE.Mesh(noseGeom2, bodyMaterial);
  nose2.rotation.z = Math.PI / 2;
  nose2.position.x = 4.5;
  plane.add(nose2);
  // Tail
  const tailGeom2 = new THREE.ConeGeometry(0.2, 0.8, 32);
  const tail2 = new THREE.Mesh(tailGeom2, bodyMaterial);
  tail2.rotation.z = -Math.PI / 2;
  tail2.position.x = -4.5;
  plane.add(tail2);
  // Main wing
  const mainWingGeom = new THREE.BoxGeometry(4, 0.08, 10);
  const mainWing = new THREE.Mesh(mainWingGeom, accentMaterial);
  mainWing.position.set(0, 0, 0);
  plane.add(mainWing);
  // Engine pods
  const engineGeom2 = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 16);
  const engineLeft2 = new THREE.Mesh(engineGeom2, engineMaterial);
  engineLeft2.rotation.z = Math.PI / 2;
  engineLeft2.position.set(1.0, -0.4, 2.5);
  plane.add(engineLeft2);
  const engineRight2 = engineLeft2.clone();
  engineRight2.position.z = -2.5;
  plane.add(engineRight2);
  // Vertical stabiliser
  const vTailGeom2 = new THREE.BoxGeometry(0.1, 1.5, 1.0);
  const vTail2 = new THREE.Mesh(vTailGeom2, accentMaterial);
  vTail2.position.set(-4.8, 0.8, 0);
  plane.add(vTail2);
  // Horizontal stabilisers
  const hTailGeom2 = new THREE.BoxGeometry(1.8, 0.08, 3);
  const hTailLeft2 = new THREE.Mesh(hTailGeom2, accentMaterial);
  hTailLeft2.position.set(-4.8, 0, 2);
  plane.add(hTailLeft2);
  const hTailRight2 = hTailLeft2.clone();
  hTailRight2.position.z = -2;
  plane.add(hTailRight2);
  // Initial position
  plane.position.y = 2;
  scene.add(plane);

  // Generate a series of mountains (cones) to populate the landscape.
  // A shared material with a rocky texture improves realism.
  const mountains = [];
  const MOUNTAIN_COUNT = 50;
  const mountainMaterial = new THREE.MeshLambertMaterial({ map: mountainTexture });
  for (let i = 0; i < MOUNTAIN_COUNT; i++) {
    const height = Math.random() * 3 + 1;
    const radius = height * 0.5;
    const geo = new THREE.ConeGeometry(radius, height, 8);
    const mountain = new THREE.Mesh(geo, mountainMaterial);
    // Position mountains randomly within an initial window in front of the player.
    mountain.position.set(
      Math.random() * 400 - 200,
      height / 2 - 0.5,
      Math.random() * 40 - 20
    );
    scene.add(mountain);
    mountains.push(mountain);
  }

  // Keep track of keyboard input.
  const keys = {};
  document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
  });
  document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });

  // Set up pointer controls for on‑screen buttons.  These virtual buttons
  // mirror the arrow keys so that touch devices can play the game.  When
  // pressed, they set the corresponding key entry to true; on release they
  // reset it to false.  Prevent default to avoid scrolling.
  function bindControlButton(elementId, code) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const setKey = (state) => {
      return (e) => {
        e.preventDefault();
        keys[code] = state;
      };
    };
    el.addEventListener('pointerdown', setKey(true));
    el.addEventListener('pointerup', setKey(false));
    el.addEventListener('pointerleave', setKey(false));
    el.addEventListener('pointercancel', setKey(false));
  }

  bindControlButton('up-btn', 'ArrowUp');
  bindControlButton('down-btn', 'ArrowDown');
  bindControlButton('left-btn', 'ArrowLeft');
  bindControlButton('right-btn', 'ArrowRight');

  // Movement parameters.  forwardSpeed is the distance moved each frame.
  const forwardSpeed = 0.2;
  const rotationSpeed = 0.02;

  // Main animation loop.
  function animate() {
    requestAnimationFrame(animate);
    updateControls();
    updatePlane();
    updateMountains();
    updateCamera();
    renderer.render(scene, camera);
  }

  /**
   * Apply keyboard controls to rotate the plane.  W/S or ArrowUp/ArrowDown pitch
   * the plane up/down, A/D or ArrowLeft/ArrowRight yaw left/right.  Rolling
   * controls could be added here with additional keys (e.g. Q/E).
   */
  function updateControls() {
    // Yaw (turn) left/right
    if (keys['KeyA'] || keys['ArrowLeft']) {
      plane.rotation.y += rotationSpeed;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
      plane.rotation.y -= rotationSpeed;
    }
    // Pitch up/down
    if (keys['KeyW'] || keys['ArrowUp']) {
      plane.rotation.z += rotationSpeed;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
      plane.rotation.z -= rotationSpeed;
    }
  }

  /**
   * Update the plane's position based on its current orientation.  The plane
   * always moves forward along its local X axis.  The altitude is clamped
   * between reasonable bounds to prevent flying too low or too high.
   */
  function updatePlane() {
    // Compute the forward direction relative to the plane's current rotation.
    const forward = new THREE.Vector3(1, 0, 0);
    forward.applyQuaternion(plane.quaternion);
    forward.normalize();
    // Move the plane forward by the forwardSpeed.
    plane.position.addScaledVector(forward, forwardSpeed);
    // Constrain altitude.
    if (plane.position.y < 0.5) plane.position.y = 0.5;
    if (plane.position.y > 20) plane.position.y = 20;
  }

  /**
   * Move mountains that are far behind the plane to a new position far in
   * front.  This creates the impression of an endless stream of terrain.
   */
  function updateMountains() {
    for (const mountain of mountains) {
      if (plane.position.x - mountain.position.x > 100) {
        // Reposition mountain ahead of the plane.
        mountain.position.x += 400;
        mountain.position.z = Math.random() * 40 - 20;
        // Randomise height and scale accordingly.
        const newHeight = Math.random() * 3 + 1;
        const scale = newHeight / mountain.geometry.parameters.height;
        mountain.scale.set(scale, scale, scale);
        mountain.position.y = (newHeight * scale) / 2 - 0.5;
      }
    }
  }

  /**
   * Position the camera relative to the plane to simulate a chase camera.
   */
  function updateCamera() {
    // Offset behind and above the plane.  Adjust these values for different
    // camera behaviour.
    const cameraOffset = new THREE.Vector3(-10, 5, 0);
    cameraOffset.applyQuaternion(plane.quaternion);
    camera.position.copy(plane.position).add(cameraOffset);
    camera.lookAt(plane.position);
  }

  // Adjust the renderer and camera when the window is resized.
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize);

  // Kick off the render loop.
  animate();
})();