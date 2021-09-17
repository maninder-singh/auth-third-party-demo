var url = require('url');
var fs = require("fs");
var {http} = require("./helper");
var config = require('./config');
var audience = "api.atlassian.com";
var scope = "offline_access read:jira-user read:jira-work manage:jira-project manage:jira-configuration write:jira-work manage:jira-webhook manage:jira-data-provider";
var redirectURI = "http://localhost:3000/jira/callback";
var state = "Should be random string value";
var callbackFile = fs.readFileSync("./templates/jira.callback.html","utf8");

function getAccessToken(code){
    var data = new TextEncoder().encode(
        JSON.stringify({
            "grant_type": "authorization_code",
            "client_id": config.JIRA_CLIENT_ID,
            "client_secret": config.JIRA_CLIENT_SECRET,
            "code": code,
            "redirect_uri": redirectURI
        })
      );
      
    return http({
      hostname: 'auth.atlassian.com',
      port: 443,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    },data);
}

function getCloudID(result){
  return http({
    hostname: 'api.atlassian.com',
    port: 443,
    path: '/oauth/token/accessible-resources',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${result['access_token']}`
    }
  }).then(function(response){
    result.cloudID = response[0].id;
    return result;
  });
}

function getJIRAProject(result){
  return http({
    hostname: 'api.atlassian.com',
    port: 443,
    path: `/ex/jira/${result.cloudID}/rest/api/2/project`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${result['access_token']}`
    }
  }).then(function(response){
    result.jiraProject = response;
    return result;
  });
}

module.exports.login = function(req,res){
    res.redirect(`https://auth.atlassian.com/authorize?audience=${audience}&client_id=${config.JIRA_CLIENT_ID}&scope=${scope}&redirect_uri=${redirectURI}&state=${state}&response_type=code&prompt=consent`);
}

module.exports.callback = function(req,res){
    var parsedURL = url.parse(req.url, true);
    var query = parsedURL.query;
    var code = query.code;
    getAccessToken(code)
    .then(function(result){
        if(result.error){
            // { error: 'access_denied', error_description: 'Unauthorized' }
            throw result;
        }else {
            // {"access_token":"","refresh_token":"","scope":"","expires_in":3600,"token_type":"Bearer"}
            return result;
        }
    })
    .then(getCloudID)
    .then(function(result){
      return result;
    })
    .then(getJIRAProject)
    .then(function(result){
      res.setHeader('content-type', "text/html; charset=utf-8");
      res.send(callbackFile.replace("ACCESS_TOKEN",result['access_token']).replace("JIRA_PROJECT",JSON.stringify(result.jiraProject)));
    })
    .catch(function(error){        
        res.send(callbackFile.replace("ACCESS_ERROR",JSON.stringify(error)));
    });
}

