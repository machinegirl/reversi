var jwt = require('jsonwebtoken');
var PubNub = require('pubnub');

module.exports.handler = (e, ctx, callback) => {

    var idToken = e.Authorization;
    var body = [];

    var accessToken = e.Authorization.split(' ')[1];
    var cert = fs.readFileSync('keys/accessTokenKey.pem.pub'); // get public key
    
    var decoded = jwt.verify(accessToken, cert, (err, decoded) => {
        if (err !== null) {
            console.log(err);
            callback({err: err});
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
            callback(null, true);
        });
    });
};
