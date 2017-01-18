let camera, controls, scene, renderer;
let planetMaterial, oceanMaterial, moonMaterial;
let startTime = new Date().getTime();
let runTime = 0;

let moonOrbit;

let planet, ocean;

const RADIUS = 100;
const SEGMENTS = 128;
const RINGS = 128;
const MOONRADIUS = 20.0;

scene = new THREE.Scene();
renderer = new THREE.WebGLRenderer({antialias: true});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

let container = document.getElementById('containerScene');
container.appendChild(renderer.domElement);
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.z = 500;
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.rotateSpeed = 0.05;

// Lights
light = new THREE.DirectionalLight(0xffffff);
light.position.set(1000, 1000, 1000);
light.castShadow = true;
scene.add(light);

window.addEventListener('resize', onWindowResize, false);

// Initialize uniforms
let sharedUniforms = {
  lightPos:     {type: 'v3', value: light.position},
  cameraPos:    {type: 'v3', value: camera.position},
  oceanLevel:   {type: 'f', value: 1.0},
  time:         {type: 'f', value: 0.0},
  avTemp:       {type: 'f', value: 7.0},
  planetRadius: {type: 'f', value: RADIUS},
};

// Combines shared uniforms with new and store in new object
let planetUniforms = Object.assign({}, sharedUniforms, {
    surfaceColor: {type: 'v3', value: [0, 0.4, 0.1]},
    shoreColor:   {type: 'v3', value: [0.95, 0.67, 0.26]},
    mountFreq:    {type: 'f', value: 0.04},
    mountAmp:     {type: 'f', value: 15.0}
  }
);

let oceanUniforms = Object.assign({}, sharedUniforms, {
    oceanColor: {type: 'v3', value: [0.0, 0.0, 1.0]}
  }
);

let moonUniforms = Object.assign({}, sharedUniforms, {
    surfaceColor: {type: 'v3', value: [0.8, 0.8, 0.8]},
    moonSpeed: {type: 'f', value: 0.001},
    moonMountFreq:    {type: 'f', value: 0.2},
    moonMountAmp:     {type: 'f', value: 2.5}
  }
);

loadShaders();
animate();
displayGUI();

function initWorld() {
  // Planet
  planet = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS), planetMaterial);
  planet.receiveShadow = true;
  planet.castShadow = true;
  scene.add(planet);

  // Ocean
  ocean = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS), oceanMaterial);
  scene.add(ocean);

  let sunMaterial = new THREE.MeshBasicMaterial();

  let sun = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS), sunMaterial);
  sun.position.set(1000.0, 1000.0, 1000.0); //Set position the same as the light position
  scene.add(sun);

  addStars();

  addMoon();
}

function loadShaders() {
  SHADER_LOADER.load(
    function (data) {
      let planetVShader = data.planetShader.vertex;
      let planetFShader = data.planetShader.fragment;

      let moonVShader = data.moonShader.vertex;
      let moonFShader = data.moonShader.fragment;

      let oceanVShader = data.oceanShader.vertex;
      let oceanFShader = data.oceanShader.fragment;

      let classicNoise3D = data.perlinNoise.vertex;
      let cellNoise3D = data.cellularNoise.vertex;

      planetMaterial = new THREE.ShaderMaterial({
        uniforms:       planetUniforms,
        vertexShader:   classicNoise3D + planetVShader,
        fragmentShader: classicNoise3D + planetFShader,
      });

      moonMaterial = new THREE.ShaderMaterial({
        uniforms:       moonUniforms,
        vertexShader:   classicNoise3D + moonVShader,
        fragmentShader: classicNoise3D + moonFShader,
      });

      oceanMaterial = new THREE.ShaderMaterial({
        uniforms:       oceanUniforms,
        vertexShader:   classicNoise3D + cellNoise3D + oceanVShader,
        fragmentShader: classicNoise3D + cellNoise3D + oceanFShader,
        transparent:    true,
      });

      initWorld();
    }
  );
}

function displayGUI() {
  let gui = new dat.GUI();
  let jar;

  // Setup initial values for controls
  let parameters = {
    surClr:    [planetUniforms.surfaceColor.value[0] * 255,     // surface color
      planetUniforms.surfaceColor.value[1] * 255,
      planetUniforms.surfaceColor.value[2] * 255],
    mountFreq: planetUniforms.mountFreq.value,
    mountAmp:  planetUniforms.mountAmp.value,
    avgTemp:   sharedUniforms.avTemp.value,
    oceColor:  [oceanUniforms.oceanColor.value[0] * 255,     // surface color
      oceanUniforms.oceanColor.value[1] * 255,
      oceanUniforms.oceanColor.value[2] * 255],
    shoColor:  [planetUniforms.shoreColor.value[0] * 255,     // surface color
      planetUniforms.shoreColor.value[1] * 255,
      planetUniforms.shoreColor.value[2] * 255],
    moonSpeed:  moonUniforms.moonSpeed.value,
    moonMountFreq: moonUniforms.moonMountFreq.value,
    moonMountAmp: moonUniforms.moonMountAmp.value,
    moonSurClr:    [moonUniforms.surfaceColor.value[0] * 255,     // surface color
      moonUniforms.surfaceColor.value[1] * 255,
      moonUniforms.surfaceColor.value[2] * 255],
  };

  // Surface controls
  let surfaceFolder = gui.addFolder('Planet');
  surfaceFolder.open();

  let planetColor = surfaceFolder.addColor(parameters, 'surClr').name('Surface Color');
  let temperature = surfaceFolder.add(parameters, 'avgTemp').min(-12.0).max(35).step(0.01).name('Temperature');
  let mountainFrequency = surfaceFolder.add(parameters, 'mountFreq').min(0.02).max(0.1).step(0.001).name('Mount freq');
  let mountainAmplitide = surfaceFolder.add(parameters, 'mountAmp').min(2.0).max(30).step(0.01).name('Mount amp');

  // Ocean controls
  let ocenFolder = gui.addFolder('Ocean');
  ocenFolder.open();

  let oceanColor = ocenFolder.addColor(parameters, 'oceColor').name('Ocean Color');
  let shoreColor = ocenFolder.addColor(parameters, 'shoColor').name('Sand Color');

  // Moon Controls
  let moonFolder = gui.addFolder('Moon');
  moonFolder.open();

  let moonColor = moonFolder.addColor(parameters, 'moonSurClr').name('Surface Color');
  let moonSpeedControl = moonFolder.add(parameters, 'moonSpeed').min(0.001).max(0.1).step(0.001).name('Moon speed');
  let moonMountainFrequency = moonFolder.add(parameters, 'moonMountFreq').min(0.1).max(0.5).step(0.001).name('Mount freq');
  let moonMountainAmplitide = moonFolder.add(parameters, 'moonMountAmp').min(2.0).max(10).step(0.01).name('Mount amp');

  planetColor.onChange(function (jar) {
    planetUniforms.surfaceColor.value[0] = jar[0] / 255;
    planetUniforms.surfaceColor.value[1] = jar[1] / 255;
    planetUniforms.surfaceColor.value[2] = jar[2] / 255;
  });

  shoreColor.onChange(function (jar) {
    planetUniforms.shoreColor.value[0] = jar[0] / 255;
    planetUniforms.shoreColor.value[1] = jar[1] / 255;
    planetUniforms.shoreColor.value[2] = jar[2] / 255;
  });

  moonColor.onChange(function (jar) {
    moonUniforms.surfaceColor.value[0] = jar[0] / 255;
    moonUniforms.surfaceColor.value[1] = jar[1] / 255;
    moonUniforms.surfaceColor.value[2] = jar[2] / 255;
  });

  mountainFrequency.onChange(function (jar) {
    planetUniforms.mountFreq.value = jar;
  });

  mountainAmplitide.onChange(function (jar) {
    planetUniforms.mountAmp.value = jar;
  });

  moonMountainFrequency.onChange(function (jar) {
    moonUniforms.moonMountFreq.value = jar;
  });

  moonMountainAmplitide.onChange(function (jar) {
    moonUniforms.moonMountAmp.value = jar;
  });

  temperature.onChange(function (jar) {
    sharedUniforms.avTemp.value = jar;
  });

  oceanColor.onChange(function (jar) {
    oceanUniforms.oceanColor.value[0] = jar[0] / 255;
    oceanUniforms.oceanColor.value[1] = jar[1] / 255;
    oceanUniforms.oceanColor.value[2] = jar[2] / 255;
  });

  moonSpeedControl.onChange(function (jar) {
    moonUniforms.moonSpeed.value = jar;
  });
}

function addStars() {
  const numberOfStars = 200;
  const starRadius = 1;
  const minRad = 500;
  const maxRad = 1000;

  const star = new THREE.SphereGeometry(starRadius, 4, 4);
  const starMaterial = new THREE.MeshLambertMaterial({color: 0xffffe6});
  for (let i = 0; i < numberOfStars; i++) {
    let starMesh = new THREE.Mesh(star, starMaterial);

    // spherical coordinate to calculate x,y,z with random angle/radius
    let r = minRad + maxRad * Math.random();
    let theta = Math.random() * 2 * Math.PI;
    let phi = Math.random() * 2 * Math.PI;

    starMesh.position.x = r * Math.sin(theta) * Math.cos(phi);
    starMesh.position.y = r * Math.sin(theta) * Math.sin(phi);
    starMesh.position.z = r * Math.cos(theta);

    starMesh.matrixAutoUpdate = false;
    starMesh.updateMatrix();
    scene.add(starMesh);
  }
}


function addMoon() {
  let moon = new THREE.Mesh(new THREE.SphereGeometry(MOONRADIUS, SEGMENTS, RINGS), moonMaterial);

  moon.castShadow = true;
  moon.receiveShadow = true;

  // parent
  moonOrbit = new THREE.Object3D();
  scene.add( moonOrbit );

  // pivots
  var pivot1 = new THREE.Object3D();
  pivot1.rotation.z = 0;
  moonOrbit.add( pivot1 );

  // mesh
  moon.position.set(0.0, 150, 100.0);
  pivot1.add( moon );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  runTime = (new Date().getTime() - startTime) / 1000;
  sharedUniforms.time.value = runTime;

  if(moonOrbit){
    moonOrbit.rotation.x += moonUniforms.moonSpeed.value;
    moonOrbit.rotation.y += moonUniforms.moonSpeed.value/2;
  }

  controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
  render();
}

function render() {
  renderer.render(scene, camera);
}