require('dotenv').config();
var express = require('express'); 
var fs = require('fs');
var config = require('./config');
var app = express();
var trello = require('./trello');
var jira = require('./jira');

var indexFile = fs.readFileSync("./templates/index.html","utf8");

var server = app.listen(3000, function () {
  console.log('Server up and running...');
  console.log("Listening on port %s", server.address().port);
  loginCallback = `http://localhost:${server.address().port}/trello/callback`;
  trello.init(loginCallback);
});


app.get("/", function (request, response) {
  response.setHeader('content-type', "text/html; charset=utf-8");
  response.send(indexFile.replace("TRELLO_API_KEY",config.TRELLO_API_KEY));
});

app.get("/trello/login", function (request, response) {
  trello.login(request, response);
});

app.get("/trello/callback", function (request, response) {
  trello.callback(request, response);
});

app.get("/jira/login", function (request, response) {
  jira.login(request,response);
});

app.get("/jira/callback", function (request, response) {
  jira.callback(request,response);
});

