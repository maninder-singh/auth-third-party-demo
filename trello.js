var OAuth = require('oauth').OAuth;
var url = require('url');
var fs = require('fs');
var config = require('./config');
var requestURL = "https://trello.com/1/OAuthGetRequestToken";
var accessURL = "https://trello.com/1/OAuthGetAccessToken";
var authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
var appName = "Trello OAuth Server Integration";
var scope = 'read';
var expiration = '1hour';
var key = config.TRELLO_API_KEY;
var secret = config.TRELLO_SECRET;
var oauth_secrets = {};
var oauth = null;
var callbackFile = fs.readFileSync("./templates/trello.callback.html","utf8");

module.exports.login = function(request, response) {
    oauth.getOAuthRequestToken(function(error, token, tokenSecret, results){
      oauth_secrets[token] = tokenSecret;
      response.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};

module.exports.callback = function(req, res) {
    var parsedURL = url.parse(req.url, true);
    var query = parsedURL.query;
    var token = query.oauth_token;
    var tokenSecret = oauth_secrets[token];
    var verifier = query.oauth_verifier;
    
    if(token === undefined && verifier === undefined){
      res.setHeader('content-type', "text/html; charset=utf-8");
      return res.send(callbackFile);
    }
  
    oauth.getOAuthAccessToken(token, tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results){
      if(error){
        res.setHeader('content-type', "text/html; charset=utf-8");
        return res.send(callbackFile.replace("ACCESS_ERROR",JSON.stringify(error)));  
      }
      oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, function(error, data, response){
        res.setHeader('content-type', "text/html; charset=utf-8");
        if(error){
          return res.send(callbackFile.replace("ACCESS_ERROR",JSON.stringify(error)));  
        }
        return res.send(callbackFile.replace("ACCESS_TOKEN",accessToken).replace("TRELLO_MEMBER",JSON.stringify(data)));
      });
    });
};

module.exports.init = function(loginCallback){
    oauth = new OAuth(requestURL, accessURL, key, secret, "1.0A", loginCallback, "HMAC-SHA1");
}

