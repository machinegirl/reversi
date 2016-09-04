var fs = require('fs');
var jwt = require('jsonwebtoken');
var PubNub = require('pubnub');
var https = require('https');
var crypto = require('crypto');

module.exports.login = function(e, ctx, callback, decoded, callback2) {

    var makeAccessToken = (body) => {
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
        return accessToken
    };

    if (decoded === null || typeof decoded === 'undefined') {
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

                    var accessToken = makeAccessToken(body);
                    callback2(accessToken);

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
    } else {
        accessToken = makeAccessToken(decoded);
        callback2(accessToken);
    }
};

module.exports.logged_in = function(e, ctx, callback, callback2) {
    var accessToken = e.headers['X-Reversi-Auth'].split(' ')[1];
    var cert = fs.readFileSync('keys/accessTokenKey.pem.pub'); // get public key
    var options = {
        algorithms: ['RS256'],
        audience: 'https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev',
        issuer: 'https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev'
    }
    var decoded = jwt.verify(accessToken, cert, options, (err, decoded) => {
        if (err !== null) {
            console.log(err);
            callback(err);
            return;
        }
        callback2(decoded);
    });
};

module.exports.publish = function(e, ctx, callback, channel, message, callback2) {
    var keys = JSON.parse(fs.readFileSync('keys/pubnub.keys')); // get publish and subscribe keys
    pubnub = new PubNub({
        publishKey : keys.publish,
        subscribeKey : keys.subscribe
    });
    var publishConfig = {
        channel : channel,
        message : message
    };
    pubnub.publish(publishConfig, function(status, response) {
        console.log(status, response);
        callback2(status, response);
    });
};
