var PubNub = require('pubnub');

exports.handler = (e, ctx, callback) {

    pubnub = new PubNub({
        publishKey : 'pub-c-1fe9d7cd-6d1c-46d6-bc97-efcbbab4d6c2',
        subscribeKey : 'sub-c-d135f9a0-6ccd-11e6-92a0-02ee2ddab7fe'
    });

    function publishSampleMessage() {
        console.log('Since we\'re publishing on subscribe connectEvent, we\'re sure we\'ll receive the following publish.');
        var publishConfig = {
            channel : 'Channel-reversi-system',
            message : 'Reversi is cool.'
        };
        pubnub.publish(publishConfig, function(status, response) {
            console.log(status, response);
            callback(null, {"msg": "I like it."});
        });
    }

    pubnub.addListener({
        status: function(statusEvent) {
            if (statusEvent.category === 'PNConnectedCategory') {
                publishSampleMessage();
            }
        },
        message: function(message) {
            console.log('New Message!!', message);
        },
        presence: function(presenceEvent) {
            // handle presence
        }
    });
    console.log('Subscribing..');
    pubnub.subscribe({
        channels: ['Channel-reversi-system']
    });
};
