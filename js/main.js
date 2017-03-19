let camera, controls, scene, renderer;
let sunMaterial, planetMaterial, oceanMaterial, atmosphereMaterial, moonMaterial;
let startTime = new Date().getTime();
let runTime = 0;

let moonOrbit;

let planet, atmosphere, ocean, moon;

const RADIUS = 100;
const SEGMENTS = 128;
const RINGS = 128;
const MOONRADIUS = 20.0;

scene = new THREE.Scene();
renderer = new THREE.WebGLRenderer({antialias: true});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

let container = document.getElementById('containerScene');
container.appendChild(renderer.domElement);
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000000);
camera.position.z = 500;
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enableRotate = true;
controls.rotateSpeed = 0.05;

// Lights
let light = new THREE.DirectionalLight( 0xFFAA55, 1, 100 );
light.position.set(250, 250, 250);
light.castShadow = true;
scene.add(light);

light.shadow.mapSize.width = 512;  // default
light.shadow.mapSize.height = 512; // default
light.shadow.camera.near = 0.5;    // default
light.shadow.camera.far = 1000;    // default

// let helper = new THREE.CameraHelper( light.shadow.camera );
// scene.add( helper );

window.addEventListener('resize', onWindowResize, false);

// Initialize uniforms
let sharedUniforms = {
  lightPos:     {type: 'v3', value: light.position},
  cameraPos:    {type: 'v3', value: camera.position},
  oceanLevel:   {type: 'f', value: 1.0},
  time:         {type: 'f', value: 0.0},
  avgTemp:       {type: 'f', value: 7.0},
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
    oceanColor: {type: 'v3', value: [0, 11/255, 255/255]}
  }
);

let atmosphereUniforms = Object.assign({}, sharedUniforms, {
  atmosphereHeight: {type: 'f', value: 18},
  atmosphereOpacity: {type: 'f', value: 0.6}
});

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

  atmosphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS), atmosphereMaterial);
  scene.add(atmosphere);

  let sun = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS*100, SEGMENTS, RINGS), sunMaterial);
  sun.position.set(10000.0, 10000.0, 10000.0); //Set position the same as the light position
  scene.add(sun);

  addStars();

  addMoon();
}

function loadShaders() {
  SHADER_LOADER.load(
    function (data) {
      let sunVShader = data.sunShader.vertex;
      let sunFShader = data.sunShader.fragment;

      let planetVShader = data.planetShader.vertex;
      let planetFShader = data.planetShader.fragment;

      let moonVShader = data.moonShader.vertex;
      let moonFShader = data.moonShader.fragment;

      let atmosphereVShader = data.atmosphereShader.vertex;
      let atmosphereFShader = data.atmosphereShader.fragment;

      let oceanVShader = data.oceanShader.vertex;
      let oceanFShader = data.oceanShader.fragment;

      let classicNoise3D = data.perlinNoise.vertex;
      let cellNoise3D = data.cellularNoise.vertex;

      sunMaterial = new THREE.ShaderMaterial({
        uniforms:       sharedUniforms,
        vertexShader:   cellNoise3D + classicNoise3D + sunVShader,
        fragmentShader: cellNoise3D + classicNoise3D + sunFShader,
      });

      planetMaterial = new THREE.ShaderMaterial({
        uniforms:       planetUniforms,
        vertexShader:   classicNoise3D + planetVShader,
        fragmentShader: classicNoise3D + planetFShader,
      });

      moonMaterial = new THREE.ShaderMaterial({
        uniforms:       moonUniforms,
        vertexShader:   cellNoise3D + classicNoise3D + moonVShader,
        fragmentShader: classicNoise3D + moonFShader,
      });

      atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms:       atmosphereUniforms,
        vertexShader:   classicNoise3D + atmosphereVShader,
        fragmentShader: classicNoise3D + atmosphereFShader,
        side: THREE.DoubleSide,
        transparent: true
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
  let newValue;

  // Setup initial values for controls
  let parameters = {
    surClr:    [planetUniforms.surfaceColor.value[0] * 255,     // surface color
      planetUniforms.surfaceColor.value[1] * 255,
      planetUniforms.surfaceColor.value[2] * 255],
    mountFreq: planetUniforms.mountFreq.value,
    mountAmp:  planetUniforms.mountAmp.value,
    avgTemp:   sharedUniforms.avgTemp.value,
    oceColor:  [oceanUniforms.oceanColor.value[0] * 255,     // surface color
      oceanUniforms.oceanColor.value[1] * 255,
      oceanUniforms.oceanColor.value[2] * 255],
    shoColor:  [planetUniforms.shoreColor.value[0] * 255,     // surface color
      planetUniforms.shoreColor.value[1] * 255,
      planetUniforms.shoreColor.value[2] * 255],
    atmosphereHeight: atmosphereUniforms.atmosphereHeight.value,
    atmosphereOpacity: atmosphereUniforms.atmosphereOpacity.value,
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
  let atmosphereHeight = surfaceFolder.add(parameters, 'atmosphereHeight').min(5.0).max(30.0).step(0.1).name('Atm. height');
  let atmosphereOpacity = surfaceFolder.add(parameters, 'atmosphereOpacity').min(0.0).max(1.0).step(0.01).name('Atm. opacity');

  // Ocean controls
  let ocenFolder = gui.addFolder('Ocean');
  ocenFolder.open();

  let oceanColor = ocenFolder.addColor(parameters, 'oceColor').name('Ocean Color');
  let shoreColor = ocenFolder.addColor(parameters, 'shoColor').name('Sand Color');

  // Moon Controls
  let moonFolder = gui.addFolder('Moon');
  moonFolder.open();

  let moonColor = moonFolder.addColor(parameters, 'moonSurClr').name('Surface Color');
  let moonSpeedControl = moonFolder.add(parameters, 'moonSpeed').min(0.0).max(0.1).step(0.001).name('Moon speed');
  let moonMountainFrequency = moonFolder.add(parameters, 'moonMountFreq').min(0.1).max(0.3).step(0.0001).name('Mount freq');
  let moonMountainAmplitide = moonFolder.add(parameters, 'moonMountAmp').min(2.0).max(10).step(0.01).name('Mount amp');

  planetColor.onChange(function (newValue) {
    planetUniforms.surfaceColor.value[0] = newValue[0] / 255;
    planetUniforms.surfaceColor.value[1] = newValue[1] / 255;
    planetUniforms.surfaceColor.value[2] = newValue[2] / 255;
  });

  shoreColor.onChange(function (newValue) {
    planetUniforms.shoreColor.value[0] = newValue[0] / 255;
    planetUniforms.shoreColor.value[1] = newValue[1] / 255;
    planetUniforms.shoreColor.value[2] = newValue[2] / 255;
  });

  moonColor.onChange(function (newValue) {
    moonUniforms.surfaceColor.value[0] = newValue[0] / 255;
    moonUniforms.surfaceColor.value[1] = newValue[1] / 255;
    moonUniforms.surfaceColor.value[2] = newValue[2] / 255;
  });

  temperature.onChange(function (newValue) {
    sharedUniforms.avgTemp.value = newValue;
  });

  atmosphereOpacity.onChange(function (newValue) {
    atmosphereUniforms.atmosphereOpacity.value = newValue;
  });

  mountainFrequency.onChange(function (newValue) {
    planetUniforms.mountFreq.value = newValue;
  });

  mountainAmplitide.onChange(function (newValue) {
    planetUniforms.mountAmp.value = newValue;
  });

  atmosphereHeight.onChange(function (newValue) {
    atmosphereUniforms.atmosphereHeight.value = newValue;
  });

  moonMountainFrequency.onChange(function (newValue) {
    moonUniforms.moonMountFreq.value = newValue;
  });

  moonMountainAmplitide.onChange(function (newValue) {
    moonUniforms.moonMountAmp.value = newValue;
  });

  oceanColor.onChange(function (newValue) {
    oceanUniforms.oceanColor.value[0] = newValue[0] / 255;
    oceanUniforms.oceanColor.value[1] = newValue[1] / 255;
    oceanUniforms.oceanColor.value[2] = newValue[2] / 255;
  });

  moonSpeedControl.onChange(function (newValue) {
    moonUniforms.moonSpeed.value = newValue;
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
  moon = new THREE.Mesh(new THREE.SphereGeometry(MOONRADIUS, SEGMENTS, RINGS), moonMaterial);

  moon.castShadow = true;
  moon.receiveShadow = true;

  // parent
  moonOrbit = new THREE.Object3D();
  scene.add( moonOrbit );

  // pivots
  var pivot = new THREE.Object3D();
  pivot.rotation.z = 0;
  moonOrbit.add( pivot );

  // mesh
  moon.position.set(0.0, 150, 100.0);
  pivot.add( moon );
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