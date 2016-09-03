var jwt = require('jsonwebtoken');
var fs = require('fs');

exports.handler = (e, ctx, callback) => {

    var accessToken = e.Authorization.split(' ')[1];
    var cert = fs.readFileSync('keys/accessTokenKey.pem.pub'); // get public key
    var options = {
        algorithms: ['RS256'],
        audience: 'https://w0jk0atq5l.execute-api.us-east-1.amazonaws.com/prod',
        issuer: 'https://w0jk0atq5l.execute-api.us-east-1.amazonaws.com/prod'
    }
    var decoded = jwt.verify(accessToken, cert, (err, decoded) => {
        if (err !== null) {
            console.log(err);
            callback({err: err});
            return;
        }
        callback(null, true);
    });


};
