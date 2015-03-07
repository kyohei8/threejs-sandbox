'use strict';
require('../app.styl');
let THREE = require('three');
let OrbitControls = require('three-orbit-controls')(THREE);
let Stats = require('stats-js');

let container, stats;
let camera, controls, scene, geometry, renderer;
let positions, colors, particles, particlePositions;
let pointCloud, group, linesMesh;


let particlesData = [];

//グループを作成した時の四角の半径
let r = 2800;
let rHalf =  r / 2;

let maxParticleCount = 200;
let particleCount = 200; // パーティクル（dot）の数
let minDistance = 440;
let limitConnections = true;
let maxConnections = 3;

let init = function(){
  container = document.getElementById('container');

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
  camera.position.z = 1750;
  controls = new OrbitControls(camera, container);


  // なぜ二乗するのか？
  let segments = maxParticleCount * maxParticleCount;

  // 頂点情報と色の配列を生成
  // この時点では [0,0,0] * segments
  positions = new Float32Array(segments * 3);
  colors = new Float32Array(segments * 3);
  // パーティクルのインスタンスを生成
  let pMaterial = new THREE.PointCloudMaterial({
    color          : 0xFFFFFF,
    size           : 2,
    blending       : THREE.AdditiveBlending,
    transparent    : true, //透過？
    sizeAttenuation: false
  });

  // BufferGeometryを生成
  // BufferGeometry とは 頂点位置、法線、色などすべてのデータを格納するバッファ
  // Geometryとは「形」を表すもの
  particles = new THREE.BufferGeometry();
  // パーティクル全体の位置情報を生成
  // この時点では[0,0,0] * パーティクル数の配列（１次元配列）
  particlePositions = new Float32Array(maxParticleCount * 3);

  // パーティクルの位置をランダムに生成、
  // particlesDataにパーティクルの属性を詰める
  for(let i = 0; i < maxParticleCount; i++){

    let x = Math.random() * r - r / 2;
    let y = Math.random() * r - r / 2;
    let z = Math.random() * r - r / 2;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    // パーティクルごとの属性
    //  THREE.Vector3はx,y,zのオブジェクトを生成する
    //  ex.
    //    new THREE.Vector3()
    //    ↓
    //    {x: 0, y:0, z:0}
    particlesData.push({
      velocity      : new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
      numConnections: 0
    });

  }
  //drawcallsという配列に値を詰める
  // ??
  particles.drawcalls.push({
    start: 0,
    count: particleCount,
    index: 0
  });

  // position属性をつける
  particles.addAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  console.log(particles);

  // particle systemを作成
  pointCloud = new THREE.PointCloud(particles, pMaterial);

  group = new THREE.Object3D();
  group.add(pointCloud);

  // what is this?
  geometry = new THREE.BufferGeometry();

  geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

  geometry.computeBoundingSphere();

  geometry.drawcalls.push({
    start: 0,
    count: 0,
    index: 0
  });
  // line?
  let material = new THREE.LineBasicMaterial({
    color: 0x111111
  });
  linesMesh = new THREE.Line(geometry, material, THREE.LinePieces);
  console.log(linesMesh.material);
  group.add(linesMesh);

  scene.add(group);


  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  container.appendChild(renderer.domElement);

  // set stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  window.addEventListener('resize', onWindowResize, false);

};

let onWindowResize = function(){

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

};

let animate = function(){

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  //コネクションをリセット？
  for ( let i = 0; i < particleCount; i++ )
    particlesData[ i ].numConnections = 0;

  for ( let i = 0; i < particleCount; i++ ) {
    // particleを取得
    let particleData = particlesData[i];

    //パーティクルの位置を動かす
    particlePositions[ i * 3     ] += particleData.velocity.x;
    particlePositions[ i * 3 + 1 ] += particleData.velocity.y;
    particlePositions[ i * 3 + 2 ] += particleData.velocity.z;

    // 一定の範囲をはみ出ないようにする
    // x
    if ( particlePositions[ i * 3 ] < -rHalf || particlePositions[ i * 3 ] > rHalf )
      particleData.velocity.x = -particleData.velocity.x;
    // y
    if ( particlePositions[ i * 3 + 1 ] < -rHalf || particlePositions[ i * 3 + 1 ] > rHalf )
      particleData.velocity.y = -particleData.velocity.y;
    // z
    if ( particlePositions[ i * 3 + 2 ] < -rHalf || particlePositions[ i * 3 + 2 ] > rHalf )
      particleData.velocity.z = -particleData.velocity.z;

    // 現状のコネクション数が基底の値を超えていたら処理しない（それ以上コネクションを増やさない）
    if ( limitConnections && particleData.numConnections >= maxConnections )
      continue;
    // collisionをチェック
    for ( let j = i + 1; j < particleCount; j++ ) {
      //近しい点がある場合線を引く
      let particleDataB = particlesData[ j ];
      if ( limitConnections && particleDataB.numConnections >= maxConnections )
        continue;

      let dx = particlePositions[ i * 3     ] - particlePositions[ j * 3     ];
      let dy = particlePositions[ i * 3 + 1 ] - particlePositions[ j * 3 + 1 ];
      let dz = particlePositions[ i * 3 + 2 ] - particlePositions[ j * 3 + 2 ];
      // 2点の距離
      let dist = Math.sqrt( dx * dx + dy * dy + dz * dz );

      if ( dist < minDistance ) {

        particleData.numConnections++;
        particleDataB.numConnections++;

        let alpha = 1.0 - dist / minDistance + 0.2;
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
  linesMesh.material.setValues({
    //color: '#'+Math.floor(Math.random()*16777215).toString(16)
  });
  linesMesh.geometry.drawcalls[ 0 ].count = numConnected * 2;
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;
  // dotをupdate
  pointCloud.geometry.attributes.position.needsUpdate = true;

  requestAnimationFrame(animate);
  stats.update();
  render();

};

let render = function(){
  let time = Date.now() * 0.001;

  group.rotation.y = time * 0.1;

  renderer.render(scene, camera);

};

init();
animate();