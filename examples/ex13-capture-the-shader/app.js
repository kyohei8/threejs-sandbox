'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.z = 1750;
  controls = new OrbitControls( camera, container );

  var axisHelper = new THREE.AxisHelper(2);
  scene.add(axisHelper);

  // -----------------------------------------------------------------
  // insert your creativity :D
  // -----------------------------------------------------------------


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

let animate = function(){

  // insert your creativity :D

  requestAnimationFrame(animate);
  stats.update();
  render();

};

let render = function(){

  renderer.render( scene, camera );

};

init();
animate();