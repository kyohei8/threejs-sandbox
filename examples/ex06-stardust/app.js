'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;
let clock = new THREE.Clock();
let particleGroup, emitter;

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, .1, 4000 );
  camera.position.z = 50;
  scene.add(camera);
  //controls = new OrbitControls( camera, container );

  //var axisHelper = new THREE.AxisHelper( 2 );
  //scene.add( axisHelper );

  // -----------------------------------------------------------------
  particleGroup = new SPE.Group({
    texture: THREE.ImageUtils.loadTexture('../img/spark.png'),
    maxAge: 2,
    colorize: 1,
    blending: THREE.AdditiveBlending
  });
  let emitterSettings = {
    positionSpread: new THREE.Vector3(100, 100, 100),

    acceleration: new THREE.Vector3(0, 0, 2),

    velocity: new THREE.Vector3(0, 0, 1),
    colorStart: new THREE.Color('white'),
    colorEnd: new THREE.Color('red'),
    sizeStart: 4,
    sizeEnd: 8,
    opacityStart: 0,
    opacityMiddle: .7,
    opacityEnd: 0,

    particleCount: 800
  };

  var colors = ["red", "orange", "yellow", "green", "blue", "violet", "pink", "magenta", "cyan", "steelblue", "seagreen"];
  for(let i = 0; i < colors.length; i++){
    emitterSettings.colorMiddle = new THREE.Color(colors[i]);
    emitterSettings.colorEnd = new THREE.Color(colors[i]);
    particleGroup.addPool( 1, emitterSettings, false);
  }

  //particleGroup.addEmitter( emitter );
  scene.add( particleGroup.mesh );

  // -----------------------------------------------------------------

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio(1);//window.devicePixelRatio ); これだとRetinaで重い・・
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  // set stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
  window.addEventListener( 'mousemove', onMouseMove, false );
};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};

let mouse = [.5, .5];
let onMouseMove = function(e){
  mouse[0] = e.clientX / window.innerWidth;
  mouse[1] = e.clientY / window.innerHeight;
};


let ct = 0;
let animate = function(){
  ct++;
  let delta = clock.getDelta();

  particleGroup.tick(delta);
  if ( ct % 32 === 0 )
    particleGroup.triggerPoolEmitter( 1, new THREE.Vector3() );

  requestAnimationFrame(animate);
  stats.update();
  render();

};

let render = function(){
  let zoom = 10;
  // mouseの値は 0〜1の間を遷移
  camera.position.x = -Math.sin( Math.PI * (mouse[0] - .5)) * zoom;
  camera.position.y = Math.sin(.25 * Math.PI * (mouse[1] - .5)) * zoom;
  //camera.position.z = Math.cos(.5 * Math.PI * (mouse[0] - .5)) * zoom;
  camera.lookAt(scene.position);

  renderer.render( scene, camera );
};

init();
animate();
