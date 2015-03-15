export let ShaderTypes = {
  // フラグメントシェーダ
  // 3つのuniform変数を定義
  //  time ... javascriptからミリsec単位で時間を送ってもらっている ex. 1.234
  //  mouse ... javascriptからマウスカーソルの位置を0〜1で受け取る ex. [0.3, 0.1]
  //  resolution ... javascript スクリーンの幅を受け取る ex. [512, 512]
  gradationColor:`
  precision mediump float;
  uniform float time;
  uniform vec2 mouse;
  uniform vec2 resolution;
  void main(void){
    // 正規化
    // gl_FragCoord の中身の範囲は、0 ～ スクリーンの横幅(もしくは縦幅)の最大値
    // それを2倍して画面幅でわると -1〜1の間の値が返る
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

    // なので p.xy は(vec2で)[-1〜1, -1〜1)]となる
    // 0~1の値にしたいので
    // まず+1 をする。そうすると [0〜2, 0〜2]となる
    // それを半分でわって [0〜1, 0〜1]の値をだす
    vec2 color = (vec2(1.0) + p.xy) * 0.5;

    // ポジションをrgbaに変換
    // colorは[0(〜1), 0(〜1)]のvec2なのでそれをそれぞれred, greenに当てはめる
    // [0, 0, 0, 1] から [1, 1, 0, 1]になる
    // GLSLでは左下が0,0になる
    // (0,1)  (1,1)
    //   +-----+
    //   |     |
    //   |     |
    //   +-----+
    // (0.0)  (1,0)
    gl_FragColor = vec4(color, p.x, 1.0);
  }
  `,
  'ripple':`
    precision mediump float;
    uniform float time;
    uniform vec2  mouse;
    uniform vec2  resolution;

    void main(void){
        // 上述の通りの正規化
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        // マウスのカーソルの位置を[0~1, 0~1]から[-1~1, -1~1]に変換
        // ※ GLSLではy軸は上がプラスなので、正負が反転している
        vec2 mouse = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);

        // length ... 2点間の距離を返す
        // ベクトルと時間から正弦波を生成している
        float t = sin(length(mouse - p) * 20.0 + time * 5.0);
        gl_FragColor = vec4(vec2(t), 0.3, 1.0);
    }
  `,
  'moving ripple':`
    precision mediump float;
    uniform float time;
    uniform vec2 mouse;
    uniform vec2 resolution;

    void main(void){
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        vec2 mouse = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);

        float t = 0.02 / abs(sin(time) - length(mouse - p));
        gl_FragColor = vec4(vec3(t), 1.0);
    }

  `,

  'Mandelbrot set':`
    precision mediump float;
    uniform float time;
    uniform vec2 mouse;
    uniform vec2 resolution;

    //HSVカラーを生成
    vec3 hsv(float h, float s, float v){
      vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
      return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0 , 1.0), s);
    }

    void main(void){
      // マウス座標を正規化
      vec2 m = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);
      // フラグメントを正規化
      vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

      // マンデルブロ集合を定義
      // カウンタ
      int j = 0;
      // 原点（少しずらしている）
      vec2 x = p + vec2(-0.5, 0.0);
      // マウス座標を使って拡大度?を変更
      float y = 1.5 - mouse.x * 0.5;
      // 漸化式 Z の初期値
      vec2 z = vec2(0.0, 0.0);

      //漸化式の繰り返し処理
      float fnum = float(100);
      for(int i=0; i < 100; i++){
        j++;
        // 2を超えると確実に発散する
        if(length(z) > 2.0){
          break;
        }
        //Zn+1 = Zn^2 + C
        z = vec2(z.x * z.x - z.y * z.y , 2.0 * z.x * z.y) + x * y;
      }

      //時間の経過とともにhsvを出力
      float h = mod(time * 20.0, 360.0) / 360.0;
      vec3 rgb = hsv(h, 1.0, 1.0);

      // 繰り返した回数を元に輝度を決める
      float t = float(j) / fnum;

      //最終的な色を出力
      gl_FragColor = vec4(rgb * t, 1.0);
    }
  `
};