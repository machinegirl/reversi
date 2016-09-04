var https = require('https');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var fs = require('fs');

module.exports.handler = (e, ctx, callback) => {

    var idToken = e.idToken;
    var body = [];

    https.get('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken, function(res) {

        res.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {

            if (res.statusCode === 200) {
                body = Buffer.concat(body).toString();
                body = JSON.parse(body);

                var key = JSON.parse(fs.readFileSync('keys/googleIdentityPlatform.key'));

                if (key.length > 0 && body.aud !== key) {
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
                    issuer: 'https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev',
                    subject: body.sub,
                    audience: [body.sub, 'https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev', 'https://reversi-2016.appspot.com'],
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
