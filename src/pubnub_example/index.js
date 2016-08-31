var PubNub = require('pubnub');

console.log('hello1');

exports.handler = (e, ctx, callback) => {

    console.log('hello2');

    pubnub = new PubNub({
        publishKey : 'pub-c-1fe9d7cd-6d1c-46d6-bc97-efcbbab4d6c2',
        subscribeKey : 'sub-c-d135f9a0-6ccd-11e6-92a0-02ee2ddab7fe'
    });

    function publishSampleMessage() {
        console.log('Since we\'re publishing on subscribe connectEvent, we\'re sure we\'ll receive the following publish.');
        var publishConfig = {
            channel : 'Channel-reversi-system',
            message : {"msg": "Reversi is cool."}
        };
        pubnub.publish(publishConfig, function(status, response) {
            console.log(status, response);
            callback(null, {"msg": "I like it."});
        });
    }

    publishSampleMessage();
};
