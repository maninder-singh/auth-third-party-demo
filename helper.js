var https = require("https");

module.exports.http = function(options,data){
    return new Promise(function(resolve,reject){
        var req = https.request(options, res => { 
            var payload = "";                   
            res.on('data', d => {
              payload += d;
            });            
            res.on('end', () => {
                resolve(JSON.parse(payload));
            });
          });
          
          req.on('error', error => {
            reject(error);
          });

          if((options.method === "POST" || options.method === "PUT") && data){
            req.write(data);
          }
          
          req.end();
    });
};