var fs = require('fs');
var jwt = require('jsonwebtoken');
var PubNub = require('pubnub');

module.exports.logged_in = function(e, ctx, callback, callback2) {
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
            callback(err);
            return;
        }
        callback2(decoded);
    });
};

module.exports.publish = function(e, ctx, callback, channel, message, callback2) {
    pubnub = new PubNub({
        publishKey : 'pub-c-92aab6bf-88ba-4ebc-a6b2-298484763e5d',  // TODO: Load these from a file.
        subscribeKey : 'sub-c-ee9c502c-6e51-11e6-92a0-02ee2ddab7fe'
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
