'use strict';
require('../app.styl');
let THREE = require('three');
//let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

const TEXT = 'ABCDE';
var container;

var scene, camera, light, renderer;
var geometry, cube, mesh, material;
var mouse;

var data, texture, points;

var fboParticles, rtTexturePos, rtTexturePos2, simulationShader;
let controls;
init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  renderer = new THREE.WebGLRenderer( { antialias: false,devicePixelRatio:1 } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set(150, 0, 380);
  //camera
  scene.add( camera );

  //controls = new THREE.OrbitControls2( camera );
  //controls.radius = 400;
  //controls.speed = 3;

  //

  //var width = 2048, height = 2048;
  var width = 1024, height = 1024;
  //var width = 512, height = 512;
  // var width = 128, height = 128;

  if ( ! renderer.context.getExtension( 'OES_texture_float' ) ) {

    alert( 'OES_texture_float is not :(' );

  }

  // Start Creation of DataTexture
  // Could it be simplified with THREE.FBOUtils.createTextureFromData(textureWidth, textureWidth, data); ?

  data = new Float32Array( width * height * 3 );

  var textGeo = new THREE.TextGeometry( TEXT, {

    size: 1,
    height: 0.5,
    curveSegments: 0,

    font: "helvetiker",
    weight: "bold",
    style: "normal",

    bevelThickness: 2,
    bevelSize: 5,
    bevelEnabled: false

  });

  textGeo.applyMatrix( new THREE.Matrix4().makeTranslation( -0.9, 0, 0.2 ) );

  points = THREE.GeometryUtils.randomPointsInGeometry( textGeo, data.length / 3 );

  for ( var i = 0, j = 0, l = data.length; i < l; i += 3, j += 1 ) {

    data[ i ] = points[ j ].x;
    data[ i + 1 ] = points[ j ].y;
    data[ i + 2 ] = points[ j ].z;

  }

  console.log( data.length / 3 );

  texture = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  // zz85 - fbo init

  rtTexturePos = new THREE.WebGLRenderTarget(width, height, {
    wrapS:THREE.RepeatWrapping,
    wrapT:THREE.RepeatWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBFormat,
    type:THREE.FloatType,
    stencilBuffer: false
  });

  rtTexturePos2 = rtTexturePos.clone();

  simulationShader = new THREE.ShaderMaterial({

    uniforms: {
      tPositions: { type: "t", value: texture },
      origin: { type: "t", value: texture },
      timer: { type: "f", value: 0}
    },

    vertexShader: document.getElementById('texture_vertex_simulation_shader').textContent,
    fragmentShader:  document.getElementById('texture_fragment_simulation_shader').textContent

  });

  fboParticles = new THREE.FBOUtils( width, renderer, simulationShader );
  fboParticles.renderToTexture(rtTexturePos, rtTexturePos2);

  fboParticles.in = rtTexturePos;
  fboParticles.out = rtTexturePos2;


  geometry = new THREE.Geometry();

  for ( var i = 0, l = width * height; i < l; i ++ ) {

    var vertex = new THREE.Vector3();
    vertex.x = ( i % width ) / width ;
    vertex.y = Math.floor( i / width ) / height;
    geometry.vertices.push( vertex );

  }

  material = new THREE.ShaderMaterial( {

    uniforms: {

      "map": { type: "t", value: rtTexturePos },
      "width": { type: "f", value: width },
      "height": { type: "f", value: height },

      "pointSize": { type: "f", value: 1 }

    },
    vertexShader: document.getElementById( 'vs-particles' ).textContent,
    fragmentShader: document.getElementById( 'fs-particles' ).textContent,
    depthTest: false,
    transparent: true

  } );

  mesh = new THREE.ParticleSystem( geometry, material );
  scene.add( mesh );

  //mouse = new THREE.Vector3( 0, 0, 1 );

  //document.addEventListener( 'mousemove', onDocumentMouseMove, false );

}

function onDocumentMouseMove( event ) {

  mouse.x = ( event.clientX - window.innerWidth / 2 );
  mouse.y = ( event.clientY - window.innerHeight / 2 );

}

function animate() {

  requestAnimationFrame( animate );
  render();

}

var timer = 0;

function render() {

  timer += 0.01;
  simulationShader.uniforms.timer.value = timer;
  //console.log(fboParticles.in);
  // swap
  var tmp = fboParticles.in;
  fboParticles.in = fboParticles.out;
  fboParticles.out = tmp;

  simulationShader.uniforms.tPositions.value = fboParticles.in;
  fboParticles.simulate(fboParticles.out);
  material.uniforms.map.value = fboParticles.out;

  //controls.update();

  renderer.render( scene, camera );

}