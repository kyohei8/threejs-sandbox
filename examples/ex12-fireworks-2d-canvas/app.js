//http://creativejs.com/tutorials/creating-fireworks/
// をES6で書きなおした
'use strict';
require('../app.styl');

let mainCanvas, mainContext;
let fireworkCanvas, fireworkContext;
let particles = [];
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;

import {Particle} from './modules/particle'
import {Library} from './modules/library';

class Fireworks{
  /**
   * 初期化関数
   */
  constructor(){
    // 花火用のcanvasを生成
    mainCanvas = document.createElement('canvas');
    mainContext = mainCanvas.getContext('2d');
    // 火花の画像を保持するcanvasを生成
    fireworkCanvas = document.createElement('canvas');
    fireworkContext = fireworkCanvas.getContext('2d');

    // 花火の色を設定
    this.createFireworkPalette(12, Library.bigGlow);

    // メインキャンバスのサイズ等を設定
    this.setMainCanvasDimensions();

    // canvasを追加
    let container = document.getElementById('container');
    container.appendChild(mainCanvas);

    document.addEventListener('mouseup', () => this.createFirework() , true);
    document.addEventListener('touchend',() =>  this.createFirework() , true);
    window.addEventListener('resize', () => this.onWindowResize() , false);

    this.update();
  }


  createFirework(){
    Fireworks.createParticle();
  }

  /**
   * 花火を生成
   * @param pos
   * @param target
   * @param vel
   * @param color
   * @param usePhysics
   */
  static createParticle(pos={}, target={}, vel={}, color='', usePhysics=false){
    particles.push(new Particle(// position
      {
        x: pos.x || Math.random() * viewportWidth,
        y: pos.y || viewportHeight + 10
      }, // target
      {
        y: target.y || 150 + Math.random() * 100
      }, // velocity
      {
        x: vel.x || Math.random() * 3 - 1.5,
        y: vel.y || 0
      }, color || Math.floor(Math.random() * 100) * 12, usePhysics)
    );
  }


  onWindowResize(){
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    this.setMainCanvasDimensions();
  }

  setMainCanvasDimensions(){
    mainCanvas.width = viewportWidth;
    mainCanvas.height = viewportHeight;
  }


  update(){
    this.clearContext();
    let self = this;
    requestAnimationFrame(function(){
      self.update();
    });
    this.drawFireworks();
  }

  /**
   * 半透明の黒でcanvasでクリアする
   * 花火の軌跡を残すためにalphaは半透明とする
   */
  clearContext(){
    mainContext.fillStyle = 'rgba(0,0,0,0.2)';
    mainContext.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  /**
   * 花火を描画する
   */
  drawFireworks(){
    var particlesIndex = particles.length;
    while(particlesIndex--){
      var particle = particles[particlesIndex];

      //trueなら爆発する
      if(particle.update()){
        //花火を削除して、パーティクルから爆発するようにする
        particles.splice(particlesIndex, 1);

        //もし物理演算を使わない場合
        // 爆発後の処理となる
        if(!particle.usePhysics){

          //if(Math.random() < 0.8){
            FireworkExplosions.star(particle);
          //}else{
          //  FireworkExplosions.circle(particle);
          //}
        }
      }
      particle.render(mainContext, fireworkCanvas);
    }
  }

  /**
   * 花火の色のブロックを生成
   *
   * @param gridSize 1つ分のgridの大きさ
   * @param img パーティクル画像
   */
  createFireworkPalette(gridSize, img){
    var size = gridSize * 10;
    fireworkCanvas.width = size;
    fireworkCanvas.height = size;
    fireworkContext.globalCompositeOperation = 'source-over';

    for(let c = 0; c < 100; c++){
      let marker = (c * gridSize);
      let gridX = marker % size;
      let gridY = Math.floor(marker / size) * gridSize;

      fireworkContext.fillStyle = `hsl(${Math.round(c * 3.6)}, 100%, 60%)`;
      fireworkContext.fillRect(gridX, gridY, gridSize, gridSize);

      fireworkContext.drawImage(img, gridX, gridY);
    }
  }
}

let FireworkExplosions = {
  /**
   * Explodes in a roughly circular fashion
   */
  circle: function(firework){

    var count = 200;
    var angle = (Math.PI * 2) / count;
    while(count--){

      var randomVelocity = 4 + Math.random() * 4;
      var particleAngle = count * angle;

      Fireworks.createParticle(firework.pos, undefined, {
        x: Math.cos(particleAngle) * randomVelocity,
        y: Math.sin(particleAngle) * randomVelocity
      }, firework.color, true);
    }
  },

  /**
   * Explodes in a star shape
   */
  star: function(firework){

    // set up how many points the firework
    // should have as well as the velocity
    // of the exploded particles etc
    // 6 - 20
    var points = 6 + Math.round(Math.random() * 15);
    // 3 - 10
    var jump = 3 + Math.round(Math.random() * 7);
    var subdivisions = 10;
    var radius = 80;
    // 3 - 6
    var randomVelocity = -(Math.random() * 3 - 6);
    var start = 0;
    var end = 0;
    var circle = Math.PI * 2;
    var adjustment = Math.random() * circle;

    do{

      // work out the start, end
      // and change values
      start = end;
      end = (end + jump) % points;
      var sAngle = (start / points) * circle - adjustment;
      var eAngle = ((start + jump) / points) * circle - adjustment;

      var startPos = {
        x: firework.pos.x + Math.cos(sAngle) * radius,
        y: firework.pos.y + Math.sin(sAngle) * radius
      };

      var endPos = {
        x: firework.pos.x + Math.cos(eAngle) * radius,
        y: firework.pos.y + Math.sin(eAngle) * radius
      };

      var diffPos = {
        x: endPos.x - startPos.x,
        y: endPos.y - startPos.y,
        a: eAngle - sAngle
      };

      // now linearly interpolate across
      // the subdivisions to get to a final
      // set of particles
      for(var s = 0; s < subdivisions; s++){

        var sub = s / subdivisions;
        var subAngle = sAngle + (sub * diffPos.a);

        Fireworks.createParticle({
          x: startPos.x + (sub * diffPos.x),
          y: startPos.y + (sub * diffPos.y)
        }, undefined, {
          x: Math.cos(subAngle) * randomVelocity,
          y: Math.sin(subAngle) * randomVelocity
        }, firework.color, true);
      }

      // loop until we're back at the start
    }while(end !== 0);

  }
};
window.onload = function(){
  new Fireworks();
};





