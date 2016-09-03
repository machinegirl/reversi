var https = require('https');
var jwt = require('jsonwebtoken');
// var time = require('time');
var crypto = require('crypto');
var fs = require('fs');

exports.handler = (e, ctx, callback) => {

    var idToken = e.idToken;
    var body = [];
    // console.log('!!idToken!!')
    // console.log(idToken);

    https.get('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken, function(res) {
        // console.log('!!result!!');
        // console.log(res);
        res.on('data', function(chunk) {

            body.push(chunk);

        }).on('end', function() {

            if (res.statusCode === 200) {
                body = Buffer.concat(body).toString();
                body = JSON.parse(body);
                // console.log(body);
                if (body.aud !== '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com') {
                    callback(null, {
                        'success': false,
                        'accessToken': null
                    });
                    return;
                }

                var cert = fs.readFileSync('keys/accessTokenKey.pem'); // get private key
                var now = Date.now()
                var randomBytes = crypto.randomBytes(20);
                const hasher = crypto.createHash('sha256');
                hasher.update(randomBytes + now.toString());
                var jti = hasher.digest('base64');
                console.log(jti);

                var options = {
                    algorithm: 'RS256',
                    issuer: 'https://w0jk0atq5l.execute-api.us-east-1.amazonaws.com/prod',
                    subject: body.sub,
                    audience: [body.sub, 'https://w0jk0atq5l.execute-api.us-east-1.amazonaws.com/prod', 'https://reversi-2016.appspot.com'],
                    expiresIn: '1h',
                    notBefore: 0,
                    jwtid: jti
                };

                var claims = {
                    email: body.email,
                    email_verified: body.email_verified,
                    name: body.name,
                    picture: body.picture,
                    given_name: body.given_name,
                    family_name: body.family_name,
                    locale: body.locale
                };

                var accessToken = jwt.sign(claims, cert, options);

                callback(null, {
                    'success': true,
                    'accessToken': accessToken
                });

            } else {
                callback(null, {
                    'success': false,
                    'accessToken': null
                });
                return;
            }

        });
    }).on('error', function(err) {
        console.log('!!error!!');
        console.log(err);
        success = false;
        callback(null, {
            'success': success,
            'accessToken': null
        });
    });
}
