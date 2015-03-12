'use strict';
require('../app.styl');
let THREE = require('three');
let Stats = require('stats-js');
let dat = require('dat-gui');
let OrbitControls = require('three-orbit-controls')(THREE);

let group, container, stats;
let particlesData = [];
let camera, scene, renderer;
let positions,colors;
let pointCloud;
let particlePositions;
let linesMesh;
let controls, geometry, particles;

let maxParticleCount = 1000;
let particleCount = 500;
let r = 800;
let rHalf = r / 2;

let effectController = {
  showDots: true,
  showLines: true,
  minDistance: 150,
  limitConnections: false,
  maxConnections: 20,
  particleCount: 500
};

let initGUI = function() {

  let gui = new dat.GUI();

  gui.add( effectController, "showDots" ).onChange( function( value ) { pointCloud.visible = value; } );
  gui.add( effectController, "showLines" ).onChange( function( value ) { linesMesh.visible = value; } );
  gui.add( effectController, "minDistance", 10, 300 );
  gui.add( effectController, "limitConnections" );
  gui.add( effectController, "maxConnections", 0, 30, 1 );
  gui.add( effectController, "particleCount", 0, maxParticleCount, 1 ).onChange( function( value ) {

    particleCount = parseInt( value );
    particles.drawcalls[ 0 ].count = particleCount;

  });

};

let init = function() {

  initGUI();

  container = document.getElementById( 'container' );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
  camera.position.z = 1750;

  controls = new OrbitControls( camera, container );

  scene = new THREE.Scene();

  geometry = new THREE.BufferGeometry();
  let material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });

  let segments = maxParticleCount * maxParticleCount;

  positions = new Float32Array( segments * 3 );
  colors = new Float32Array( segments * 3 );

  let pMaterial = new THREE.PointCloudMaterial({
    color: 0xFFFFFF,
    size: 3,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: false
  });

  particles = new THREE.BufferGeometry();
  particlePositions = new Float32Array( maxParticleCount * 3 );

  for ( let i = 0; i < maxParticleCount; i++ ) {

    let x = Math.random() * r - r / 2;
    let y = Math.random() * r - r / 2;
    let z = Math.random() * r - r / 2;

    particlePositions[ i * 3     ] = x;
    particlePositions[ i * 3 + 1 ] = y;
    particlePositions[ i * 3 + 2 ] = z;

    // add it to the geometry
    particlesData.push({
      velocity: new THREE.Vector3( -1 + Math.random() * 2, -1 + Math.random() * 2,  -1 + Math.random() * 2 ),
      numConnections: 0
    });

  }

  particles.drawcalls.push( {
    start: 0,
    count: particleCount,
    index: 0
  } );

  particles.addAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ) );

  // create the particle system
  pointCloud = new THREE.PointCloud( particles, pMaterial );

  group = new THREE.Object3D();

  // add it to the scene
  group.add( pointCloud );

  geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

  geometry.computeBoundingSphere();

  geometry.drawcalls.push( {
    start: 0,
    count: 0,
    index: 0
  } );

  linesMesh = new THREE.Line( geometry, material, THREE.LinePieces );
  group.add( linesMesh );

  scene.add( group );

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight );

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  container.appendChild( renderer.domElement );

  //

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};

let animate = function(){

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  for ( let i = 0; i < particleCount; i++ )
    particlesData[ i ].numConnections = 0;

  for ( let i = 0; i < particleCount; i++ ) {

    // get the particle
    let particleData = particlesData[i];

    particlePositions[ i * 3     ] += particleData.velocity.x;
    particlePositions[ i * 3 + 1 ] += particleData.velocity.y;
    particlePositions[ i * 3 + 2 ] += particleData.velocity.z;

    if ( particlePositions[ i * 3 + 1 ] < -rHalf || particlePositions[ i * 3 + 1 ] > rHalf )
      particleData.velocity.y = -particleData.velocity.y;

    if ( particlePositions[ i * 3 ] < -rHalf || particlePositions[ i * 3 ] > rHalf )
      particleData.velocity.x = -particleData.velocity.x;

    if ( particlePositions[ i * 3 + 2 ] < -rHalf || particlePositions[ i * 3 + 2 ] > rHalf )
      particleData.velocity.z = -particleData.velocity.z;

    if ( effectController.limitConnections && particleData.numConnections >= effectController.maxConnections )
      continue;

    // Check collision
    for ( let j = i + 1; j < particleCount; j++ ) {

      let particleDataB = particlesData[ j ];
      if ( effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections )
        continue;

      let dx = particlePositions[ i * 3     ] - particlePositions[ j * 3     ];
      let dy = particlePositions[ i * 3 + 1 ] - particlePositions[ j * 3 + 1 ];
      let dz = particlePositions[ i * 3 + 2 ] - particlePositions[ j * 3 + 2 ];
      let dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

      if ( dist < effectController.minDistance ) {

        particleData.numConnections++;
        particleDataB.numConnections++;

        let alpha = 1.0 - dist / effectController.minDistance + 0.2;

        positions[ vertexpos++ ] = particlePositions[ i * 3     ];
        positions[ vertexpos++ ] = particlePositions[ i * 3 + 1 ];
        positions[ vertexpos++ ] = particlePositions[ i * 3 + 2 ];

        positions[ vertexpos++ ] = particlePositions[ j * 3     ];
        positions[ vertexpos++ ] = particlePositions[ j * 3 + 1 ];
        positions[ vertexpos++ ] = particlePositions[ j * 3 + 2 ];

        colors[ colorpos++ ] = alpha;
        colors[ colorpos++ ] = alpha;
        colors[ colorpos++ ] = alpha;

        colors[ colorpos++ ] = alpha;
        colors[ colorpos++ ] = alpha;
        colors[ colorpos++ ] = alpha;

        numConnected++;
      }
    }
  }


  linesMesh.geometry.drawcalls[ 0 ].count = numConnected * 2;
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;

  pointCloud.geometry.attributes.position.needsUpdate = true;

  requestAnimationFrame( animate );

  stats.update();
  render();

};

let render = function() {

  let time = Date.now() * 0.001;

  group.rotation.y = time * 0.1;
  renderer.render( scene, camera );

};

init();
animate();
