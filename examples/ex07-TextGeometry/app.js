'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container,stats;
let camera, controls, scene, renderer;
let attributes, uniforms, geometry;

const text = "RESAS",
  height = 10,
  size = 50,
  curveSegments = 20,
  steps = 20,
  bevelThickness = 0,
  hover = 0,
  bevelSize = 1.5,
  bevelSegments = 1,//10,
  bevelEnabled = true,
  font = "helvetiker", 		// helvetiker, optimer, gentilis, droid sans, droid serif
  weight = "bold",		// normal bold
  style = "normal";		// normal italic

let object;
let material;
let textMesh1,group;

let pointLight;

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
  //camera.position.z = 350;
  camera.position.set( 0, 0, 450 );
  controls = new OrbitControls( camera, container );
  var axisHelper = new THREE.AxisHelper( 2 );
  scene.add( axisHelper );
  // -----------------------------------------------------------------
  let cameraTarget = new THREE.Vector3( 0, 0, 0 );

  var dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  dirLight.position.set( 0, 10, -100 ).normalize();
  scene.add( dirLight );
  //
  pointLight = new THREE.PointLight( 0xffffff, 1.5 );
  pointLight.position.set( 0, 110, 90 );
  scene.add( pointLight );


  group = new THREE.Group();
  group.position.y = 0;

  scene.add( group );

  createText();

  // -----------------------------------------------------------------

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setClearColor( 0x050505 );
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

let createText = function(material) {

  for(let i=0; i < text.length; i++){
    let char = text[i];
    let textGeo = new THREE.TextGeometry( char, {

      size: size,
      height: height,
      curveSegments: curveSegments,

      font: font,
      weight: weight,
      style: style,

      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled,

      material: 0,
      extrudeMaterial: 1

    });
    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();
    var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

    // ワイヤーっぽいの
    let material2 = new THREE.MeshBasicMaterial({
      color    : 0xffffff * Math.random(),
      wireframe: true
    });

    let material3 = new THREE.MeshBasicMaterial( { color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending } )
    material = new THREE.MeshFaceMaterial([new THREE.MeshPhongMaterial({
      color  : 0xffffff,
      shading: THREE.FlatShading
    }), // front
      new THREE.MeshPhongMaterial({
        color  : 0x0ff0ff,
        shading: THREE.SmoothShading
      }) // side
    ]);

    textMesh1 = new THREE.Mesh( textGeo, material2 );

    textMesh1.position.x = centerOffset + (i * 60);
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;

    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;

    group.add( textMesh1 );

  }

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

  var time = Date.now() * 0.001;
  var time2 = Date.now() * 0.0025;

  //mesh.rotation.x = time * 0.25;
  //mesh.rotation.y = time * 0.5;
  let d = 100000;

  group.rotation.y = Math.sin( Math.PI/ 20 * (time));
  pointLight.position.x = Math.sin( time2 * 0.7 ) * d;
  pointLight.position.y = Math.cos( time2 * 0.3 ) * d;
  //group.rotation.x = time * 0.5;

  //camera.lookAt( cameraTarget );

  renderer.render( scene, camera );

};

init();
animate();