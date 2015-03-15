var connect = require('connect');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var auth = require('basic-auth');

var ba = {
  name: 'test',
  pass: 'test'
};

var app = connect();

app.use(function(req, res, next){
  var credentials = auth(req);
  if(!credentials || credentials.name !== ba.name || credentials.pass !== ba.pass){
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="example"'
    });
    res.end('Authorization Required.');
  }else{
    next();
  }
});

app.use(serveStatic(__dirname));
app.use(serveIndex(__dirname, {
  filter: function(filename, index, files, dir){
    // exなんちゃらで始まるディレクトリのみ表示する
    return filename.indexOf('ex') > -1;
  },
  icons: true,
  hidden: true,
  view: 'details'
}));

app.listen(process.env.PORT || 3000);
console.log("Server Started");