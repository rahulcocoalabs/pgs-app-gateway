var express  = require('express');
var https = require('https');
const fs = require('fs');

var app      = express();
var httpProxy = require('http-proxy');
var consoleArguments = require('minimist');

var argv = consoleArguments(process.argv.slice(2));
var proxy = httpProxy.createProxyServer();
var CONFIG = require('./config.js');
var PORT = CONFIG.port?CONFIG.port:8081;
PORT = argv['port']?argv['port']:PORT; 
PORT = process.env.port?process.env.port:PORT; 

var path = null;
var port = null;
var configs = CONFIG.routes;
if(!configs) {
    console.error("No configuration found");
    process.exit(0);
}

var sslOptions = {
    key: fs.readFileSync('/etc/ssl/pgsedu.com/private.key'),
    cert: fs.readFileSync('/etc/ssl/pgsedu.com/certificate.crt'),
    ca: fs.readFileSync('/etc/ssl/pgsedu.com/ca_bundle.crt')
  };
  



console.log("Starting api gateway server at port "+PORT);

function registerRoute(app,path,server) {
    console.log("Registering route :  "+path+" --> "+server );
    app.all(path, function(req, res) { 
        console.log("Forwarding request at path :  "+path+"  ---> "+server );
        console.log("---> ");
        try {
             proxy.web(req, res, {target: server}); 
        } catch(error) {
            console.log("Error occured");
            console.log(error);
        }
    });
}
var i = 0;
var ln  = configs.length;
var config = null;
var server = null; 
while(i<ln) {
    config = configs[i];
    path = config.path;
    if(!path) continue;
    port = config.port?config.port:""; 
    server = !config.server?"https://localhost":config.server;
    if(port)
        server = server+":"+port; 
    server = !config.remotePath?server:config.remotePath; 
    path = "/"+path; 
    registerRoute(app,path,server);
    path = path+"/*"; 
    registerRoute(app,path,server);
    i++;
} 

var server = https.createServer(sslOptions, app);

server.listen(PORT);