var jwt = require('jsonwebtoken');
var fs = require('fs');

module.exports.handler = (e, ctx, callback) => {

    var accessToken = e.headers['X-Reversi-Auth'].split(' ')[1];
    var cert = fs.readFileSync('keys/accessTokenKey.pem.pub'); // get public key
    var options = {
        algorithms: ['RS256'],
        audience: 'https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev',
        issuer: 'https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev'
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
