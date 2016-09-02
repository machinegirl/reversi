var PubNub = require('pubnub');
var https = require('https');

exports.handler = (e, ctx, callback) => {

    var idToken = e.Authorization;
    var body = [];

    https.get('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken, function(res) {
        res.on('data', function(chunk) {

            body.push(chunk);

        }).on('end', function() {

            if (res.statusCode !== 200) {
                callback({
                    success: false,
                    error: 'Invalid id_token'
                });
                return;
            }
            body = Buffer.concat(body).toString();
            body = JSON.parse(body);

            if (body.aud !== '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com') {
                callback({
                    success: false,
                    error: 'Invalid aud claim'
                });
                return;
            }

            pubnub = new PubNub({
                publishKey : 'pub-c-92aab6bf-88ba-4ebc-a6b2-298484763e5d',
                subscribeKey : 'sub-c-ee9c502c-6e51-11e6-92a0-02ee2ddab7fe'
            });
            var publishConfig = {
                channel : 'game-xxxzzz',
                message : {"msg": "Starting game xxxzzz"}
            };
            pubnub.publish(publishConfig, function(status, response) {
                console.log(status, response);
                callback(null, {
                    success: true,
                });
            });
        });
    }).on('error', function(err) {
        console.log('!!error!!');
        console.log(err);
        callback({
            success: false,
            error: err
        });
    });
};
