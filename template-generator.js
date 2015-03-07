'use strict';
let fs = require('fs');
const BASE_DIR = 'examples';
let dir = process.argv[2];
if(!dir){
  console.error('!!!ERROR!!!: invalid arguments');
  return;
}
let dirPath = `${BASE_DIR}/${dir}`;
let jsTemplate =
  `require('../app.styl');
let THREE = require('three');
let Stats = require('stats-js');

let stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );
//stats.update();`;

let htmlTemplate =
  `<!DOCTYPE html>
<html>
<head lang="en">
  <title>${dir}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
</head>
<body>
<div id="container"></div>

<script src="/webpack-dev-server.js"></script>
<script type="text/javascript" src="/assets/app(add num).bundle.js"></script>
</body>
</html>`;


fs.mkdir(dirPath, function(){
  console.log(`-- generated ${dirPath}`);
  let jsFilePath = `${dirPath}/app.js`;
  let htmlFilePath = `${dirPath}/index.html`;
  fs.writeFile(jsFilePath, jsTemplate, function(err){
    if(err){
      throw err;
    }
    console.log(`-- generated ${jsFilePath}`);
    fs.writeFile(htmlFilePath, htmlTemplate, function(err){
      if(err){
        throw err;
      }
      console.log(`-- generated ${htmlFilePath}`);
    });
  });
});

