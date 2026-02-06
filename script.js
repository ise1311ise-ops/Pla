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

  // Sky sphere: a large sphere drawn with its inside faces to create a
  // simple skybox.  The colour can be changed to any sky hue.
  const skyGeometry = new THREE.SphereGeometry(500, 32, 15);
  const skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb, // sky blue
    side: THREE.BackSide
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  // Ground plane: represents the earth.  Its colour contrasts with the
  // sky.  The plane is rotated so that its surface lies in the XZ plane.
  const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
  const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x226622 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  scene.add(ground);

  // Create the plane as a group so that multiple meshes move together.
  const plane = new THREE.Group();

  // Fuselage: a cylinder aligned along the X axis.
  const fuselageGeom = new THREE.CylinderGeometry(0.2, 0.2, 4, 16);
  const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
  const fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
  fuselage.rotation.z = Math.PI / 2;
  plane.add(fuselage);

  // Nose cone at the front.
  const noseGeom = new THREE.ConeGeometry(0.2, 0.8, 16);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff8888 });
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.rotation.z = Math.PI / 2;
  nose.position.x = 2.2;
  plane.add(nose);

  // Tail cone at the back.
  const tailGeom = new THREE.ConeGeometry(0.1, 0.8, 16);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff8888 });
  const tail = new THREE.Mesh(tailGeom, tailMat);
  tail.rotation.z = -Math.PI / 2;
  tail.position.x = -2.2;
  plane.add(tail);

  // Main wings: boxes that extend on both sides of the fuselage.
  const wingGeom = new THREE.BoxGeometry(3, 0.05, 1);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wingLeft = new THREE.Mesh(wingGeom, wingMat);
  wingLeft.position.set(0, 0, 0.5);
  plane.add(wingLeft);
  const wingRight = wingLeft.clone();
  wingRight.position.z = -0.5;
  plane.add(wingRight);

  // Vertical tail fin.
  const vTailGeom = new THREE.BoxGeometry(0.1, 0.5, 0.6);
  const vTailMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const vTail = new THREE.Mesh(vTailGeom, vTailMat);
  vTail.position.set(-2, 0.3, 0);
  plane.add(vTail);

  // Horizontal tail wings.
  const hTailGeom = new THREE.BoxGeometry(1, 0.05, 0.5);
  const hTailMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const hTailLeft = new THREE.Mesh(hTailGeom, hTailMat);
  hTailLeft.position.set(-2, 0, 0.3);
  plane.add(hTailLeft);
  const hTailRight = hTailLeft.clone();
  hTailRight.position.z = -0.3;
  plane.add(hTailRight);

  // Set the initial altitude of the plane.
  plane.position.y = 2;
  scene.add(plane);

  // Generate a series of mountains (cones) to populate the landscape.
  const mountains = [];
  const MOUNTAIN_COUNT = 50;
  for (let i = 0; i < MOUNTAIN_COUNT; i++) {
    const height = Math.random() * 3 + 1;
    const radius = height * 0.5;
    const geo = new THREE.ConeGeometry(radius, height, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    const mountain = new THREE.Mesh(geo, mat);
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