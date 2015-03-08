'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;

let clock = new THREE.Clock();
let particleGroup;


let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.z = 600;
  controls = new OrbitControls( camera, container );

  //----------------------------------------------------------------------------------------
  // LIGHT
  var light = new THREE.PointLight(0xffffff);
  light.position.set(100,250,100);
  scene.add(light);

  let emitterSettings = {
    particleCount: 400,
    type: 'sphere',

    positionSpread: new THREE.Vector3(10, 10, 10), //中心点(position)からどのくらいの範囲で生成するか

    radius: 1,
    radiusSpread: 0,
    radiusScale: new THREE.Vector3(1, 1, 1),
    radiusSpreadClamp: 0,
    
    acceleration: new THREE.Vector3(0, -50, 0),
    //accelerationSpread: new THREE.Vector3(0,50,0),

    velocity:  THREE.Vector3(0, 90, 0),
    //velocitySpread:  THREE.Vector3(0, 30, 0),

    speed: 100,
    speedSpread: 100,

    sizeStart: 30 ,
    sizeStartSpread: 30,
    sizeEnd: 10,
    opacityStart: 0,
    opacityMiddle: 1,
    opacityEnd: 0,
    colorStart: new THREE.Color('white'),
    colorStartSpread: new THREE.Vector3(0.5,0.5,0.5),
    colorMiddle: new THREE.Color('red'),
    colorEnd: new THREE.Color('red'),
    particlesPerSecond: 2000,
    age: 0.2,
    duration: 0.04,
    alive: 0 // initially disabled, will be triggered later
    //emitterDuration: 0.1
  };

  // Create a particle group to add the emitter
  particleGroup = new SPE.Group({
    texture : THREE.ImageUtils.loadTexture('../img/spark.png'),
    maxAge  : 1.5,
    colorize: 1,
    blending: THREE.AdditiveBlending
  });

  var colors = ["red", "orange", "yellow", "green", "blue", "violet", "pink", "magenta", "cyan", "steelblue", "seagreen"];
  for(let i = 0; i < colors.length; i++){
    emitterSettings.colorMiddle = new THREE.Color(colors[i]);
    emitterSettings.colorEnd = new THREE.Color(colors[i]);
    particleGroup.addPool(1, emitterSettings, false);
  }

  // Add the particle group to the scene so it can be drawn.
  scene.add( particleGroup.mesh );
  //----------------------------------------------------------------------------------------

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  // set stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};

let randomVector3 = function(xMin, xMax, yMin, yMax, zMin, zMax){
  return new THREE.Vector3( xMin + (xMax - xMin) * Math.random(),
    yMin + (yMax - yMin) * Math.random(), zMin + (zMax - zMin) * Math.random() );
};


let animate = function(){

  let delta = clock.getDelta();
  particleGroup.tick( delta );
  if ( Math.random() < delta )
    particleGroup.triggerPoolEmitter( 11, randomVector3(-200,200, 50,200, -200,-100) );


  requestAnimationFrame(animate);
  stats.update();
  render();

};

let render = function(){

  renderer.render( scene, camera );

};

init();
animate();