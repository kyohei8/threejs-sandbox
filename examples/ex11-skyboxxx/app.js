'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;
let mesh;
let lat = 0, onMouseDownLat = 0, phi = 0, theta = 0, lon = 0;
let isUserInteracting = false;
let onPointerDownPointerX, onPointerDownPointerY;
let onPointerDownLon, onPointerDownLat;

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.target = new THREE.Vector3( 0, 0, 0 );

  // -----------------------------------------------------------------
  let imgFile = location.hash || '#02_Entrance';
  imgFile = imgFile.slice(1);

  var geometry = new THREE.SphereGeometry( 500, 60, 40 );
  geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

  var material = new THREE.MeshBasicMaterial( {
    map: THREE.ImageUtils.loadTexture( `/examples/ex11-skyboxxx/img/${imgFile}.jpg` )
  } );
  mesh = new THREE.Mesh( geometry, material );

  scene.add( mesh );
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

  document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'mouseup', onDocumentMouseUp, false );
  document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
  document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);

};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};

let onDocumentMouseDown = function(e){
  e.preventDefault();
  isUserInteracting = true;

  onPointerDownPointerX = e.clientX;
  onPointerDownPointerY = e.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;
};

let onDocumentMouseMove = function(e){

  if ( isUserInteracting === true ) {
    lon = ( onPointerDownPointerX - e.clientX ) * 0.1 + onPointerDownLon;
    lat = ( e.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
  }
};

let onDocumentMouseUp = function(){
  isUserInteracting = false;
};

let onDocumentMouseWheel = function(){
  if(camera.fov <= 20){
    camera.fov = 21;
    return;
  }
  if(camera.fov >= 160){
    camera.fov = 159;
    return;
  }
  // WebKit
  if ( event.wheelDeltaY ) {
    camera.fov -= event.wheelDeltaY * 0.05;
  // Opera / Explorer 9
  } else if ( event.wheelDelta ) {
    camera.fov -= event.wheelDelta * 0.05;
  // Firefox
  } else if ( event.detail ) {
    camera.fov += event.detail * 1.0;
  }

  camera.updateProjectionMatrix();

};



let animate = function(){

  requestAnimationFrame(animate);
  stats.update();
  render();

};

let render = function(){
  if ( isUserInteracting === false ){
    lon += 0.1;
  }

  lat = Math.max( - 85, Math.min( 85, lat ) );
  phi = THREE.Math.degToRad( 90 - lat );
  theta = THREE.Math.degToRad( lon );

  camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
  camera.target.y = 500 * Math.cos( phi );
  camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );
  camera.lookAt( camera.target );

  renderer.render( scene, camera );

};

init();
animate();