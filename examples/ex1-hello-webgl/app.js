require('../app.styl');
var THREE = require('three');
var Stats = require('stats-js');

//シーンを作成
var scene = new THREE.Scene();
//カメラを作成 fov, aspect ,near, far （どこからどこまで見えるか）
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 5000 );

// WebGLのレンダーを利用
var renderer = new THREE.WebGLRenderer();
// size
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

let stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );


// Boxを生成
var geometry = new THREE.BoxGeometry( 2, 2, 1 );
// マテリアル（色）
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// boxとマテリアルを組み合わせる
var cube = new THREE.Mesh( geometry, material );
// add
scene.add( cube );

camera.position.z = 20;

var render = function () {
  requestAnimationFrame( render );

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
  stats.update();
};

render();