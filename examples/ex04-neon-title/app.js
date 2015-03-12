/**
 * http://creativejs.com/ のロゴの 写経
 */
'use strict';
require('../app.styl');
let THREE = require('three');
let Stats = require('stats-js');
let OrbitControls = require('three-orbit-controls')(THREE);

let container, stats;
let camera, scene, controls, renderer;
let logoObject3D, cube;
let logoMaterials = [], logoMaterial;

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 280;
  camera.position.y = 20;
  //controls = new OrbitControls(camera, container);
  scene.add(camera);

  logoObject3D = new THREE.Object3D();
  // 横長の四角を生成
  logoObject3D.add(generateCube(0x524a55, 2, 0.7));
  // 太くて透過の高いラインを重ねてgrowy感をだす
  logoObject3D.add(generateCube(0x524a55, 4,   0.3));
  logoObject3D.add(generateCube(0x524a55, 8,   0.1));
  logoObject3D.add(generateCube(0x524a55, 12,   0.05));
  logoObject3D.add(generateCube(0x524a55, 16,   0.05));
  makeLogoPlanes();

  scene.add(logoObject3D);


  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // set stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

};

// cubeを生成する
var generateCube = function(lineColor, lineWidth, lineOpacity) {

  let material = new THREE.MeshBasicMaterial({
    opacity           : 0,
    blending          : THREE.AdditiveBlending,
    depthTest         : false,
    transparent       : true
  });

  let cubegeom = new THREE.BoxGeometry(250, 58, 58, 1, 1, 1);


  cube = new THREE.Mesh(cubegeom, material);

  var egh = new THREE.EdgesHelper( cube, lineColor );
  egh.material.linewidth = lineWidth;
  egh.material.transparent = true;
  egh.material.opacity = lineOpacity;
  egh.material.blending = THREE.AdditiveBlending;
  egh.material.depthTest = false;
  console.log( egh.material.linecap);
  scene.add( egh );

  return cube;
};

// ロゴを生成
function makeLogoPlanes(){
  //平らなGeometryを生成
  let geometry = new THREE.PlaneGeometry(200, 200 * (115 / 460), 2, 1);

  for(let i = 0; i < 20; i++){

    let material = new THREE.MeshBasicMaterial({
      map        : THREE.ImageUtils.loadTexture('../img/CreativeJSwob2.png'),
      opacity    : (i == 0) ? 0.9 : (i >= 3) ? 0.012 : 0.1,
      blending   : THREE.AdditiveBlending, //黒い部分を消す
      depthTest  : false,
      transparent: true
    });

    if(i == 1){
      geometry = new THREE.PlaneGeometry(200, 200 * (115 / 460), 1, 1);
    }

    let logo = new THREE.Mesh(geometry, material);
    //最初の３枚は後ろ、残りは前に
    logo.position.z = (i >= 3) ? (i - 2) * 5 : i * -10;
    logo.position.y = -2;

    logoObject3D.add(logo);
    if(i > 0){
      logoMaterials.push(material);
    }else{
      //最初のmaterial
      logoMaterial = material;
    }
  }
}


let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};

let xMove = 50;
let yMove = 20;
let targetX = 0, targetY = 0;
let counterX = 0, counterY = 0;
let velX = 0, velY = 0;

let animate = function(){
  let diffX, diffY, speed;
  targetX = Math.sin(counterX) * xMove;
  targetY = Math.cos(counterY) * yMove;

  counterX+=0.012;
  counterY+=0.01;
  speed = 0.01;

  velX *=0.8;
  velY *=0.8;

  diffX =  (targetX-camera.position.x) * speed;
  diffY = (targetY-camera.position.y) * speed;

  velX += diffX;
  velY += diffY;

  camera.position.x += velX;
  camera.position.y += velY;
  camera.lookAt( scene.position );

  requestAnimationFrame(animate);
  stats.update();
  render();
};

let render = function(){

  renderer.render( scene, camera );

};

init();
animate();