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
  camera.position.z = 750;
  camera.position.y = 350;
  controls = new OrbitControls( camera, container );
  var axisHelper = new THREE.AxisHelper( 2 );
  scene.add( axisHelper );
  // -----------------------------------------------------------------
  // Grid

  var line_material = new THREE.LineBasicMaterial( { color: 0x101010 } ),
    xGeometry = new THREE.Geometry(),
    yGeometry = new THREE.Geometry(),
    zGeometry = new THREE.Geometry(),
    floor = 0, step = 25;
    let width = 250;
  for ( let i = 0; i <= 20; i ++ ) {
    // Y
    yGeometry.vertices.push( new THREE.Vector3( - width, floor, i * step - width ) );
    yGeometry.vertices.push( new THREE.Vector3(   width, floor, i * step - width ) );
    yGeometry.vertices.push( new THREE.Vector3( i * step - width, floor, -width ) );
    yGeometry.vertices.push( new THREE.Vector3( i * step - width, floor,  width ) );
    // X
    xGeometry.vertices.push( new THREE.Vector3(  floor, i * step - width, - width ));
    xGeometry.vertices.push( new THREE.Vector3(  floor, i * step - width,  width ));
    xGeometry.vertices.push( new THREE.Vector3(  floor, -width , i * step - width));
    xGeometry.vertices.push( new THREE.Vector3(  floor,  width , i * step - width));
    // Y
    zGeometry.vertices.push( new THREE.Vector3(  i * step - width, - width, floor  ));
    zGeometry.vertices.push( new THREE.Vector3(  i * step - width,  width,floor ));
    zGeometry.vertices.push( new THREE.Vector3(   -width , i * step - width, floor));
    zGeometry.vertices.push( new THREE.Vector3(    width , i * step - width, floor));

  }
  var xLine = new THREE.Line( xGeometry, line_material, THREE.LinePieces );
  var yLine = new THREE.Line( yGeometry, line_material, THREE.LinePieces );
  var zLine = new THREE.Line( zGeometry, line_material, THREE.LinePieces );
  scene.add( xLine );
  scene.add( yLine );
  scene.add( zLine );
  let toHex = function(num){
    num = (num + 250) / 2;
    return parseInt(Math.abs(num)).toString(16);
  };

  // ランダムな位置に玉を生成
  for ( let i = 0; i <= 150; i ++ ){
    let x = Math.random() * 500 - 250;
    let y = Math.random() * 500 - 250;
    let z = Math.random() * 500 - 250;
    let geometry = new THREE.SphereGeometry(5, 32, 32);
    let color = `0x${toHex(x) + toHex(y) + toHex(z) }`;
    console.log(color);
    let material = new THREE.MeshBasicMaterial({color: parseInt(color) });
    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    scene.add(sphere);
  }

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