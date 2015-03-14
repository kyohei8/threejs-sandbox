'use strict';
import {Library} from './library';
/**
 * 打ち上がった花火の中心となるシングルポイントを表す
 * @param pos        位置
 * @param target     ?
 * @param vel        velocity
 * @param marker     マーカ？
 * @param usePhysics 物理演算を使うかどうか
 * @constructor
 */
class Particle{

  constructor(pos, target, vel, marker, usePhysics){
    //アニメーションの設定
    this.GRAVITY = 0.06;
    this.alpha = 1;
    this.easing = Math.random() * 0.02;
    this.fade = Math.random() * 0.1;
    this.gridX = marker % 120;
    this.gridY = Math.floor(marker / 120) * 12;
    this.color = marker;

    this.pos = {
      x: pos.x || 0,
      y: pos.y || 0
    };

    this.vel = {
      x: vel.x || 0,
      y: vel.y || 0
    };

    this.lastPos = {
      x: this.pos.x,
      y: this.pos.y
    };

    this.target = {
      y: target.y || 0
    };

    this.usePhysics = usePhysics || false;
  }

  update(){
    this.lastPos.x = this.pos.x;
    this.lastPos.y = this.pos.y;

    if(this.usePhysics){
      this.vel.y += this.GRAVITY;
      this.pos.y += this.vel.y;

      this.alpha -= this.fade;
    }else{
      let distance = (this.target.y - this.pos.y);

      this.pos.y += distance * (0.03 + this.easing);
      this.alpha = Math.min(distance * distance * 0.00005, 1);
    }

    this.pos.x += this.vel.x;

    return (this.alpha < 0.005);

  }

  render(context, fireworkCanvas){
    let x = Math.round(this.pos.x),
      y = Math.round(this.pos.y),
      xVel = (x - this.lastPos.x) * -5,
      yVel = (y - this.lastPos.y) * -5;

    context.save();
    context.globalCompositeOperation = 'lighter';
    context.globalAlpha = Math.random() * this.alpha;

    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.beginPath();
    context.moveTo(this.pos.x, this.pos.y);
    context.lineTo(this.pos.x + 1.5, this.pos.y);
    context.lineTo(this.pos.x + xVel, this.pos.y + yVel);
    context.lineTo(this.pos.x - 1.5, this.pos.y);
    context.closePath();
    context.fill();

    // imageを描画
    context.drawImage(fireworkCanvas, this.gridX, this.gridY, 12, 12, x - 6, y - 6, 12, 12);
    context.drawImage(Library.smallGlow, x - 3, y - 3);

    context.restore();
  }

}

export { Particle };