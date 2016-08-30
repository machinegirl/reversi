var PubNub = require('pubnub');

exports.handler = (e, ctx, callback) => {
  pubnub = new PubNub({
    publishKey : 'pub-c-d617ce4f-25a6-4cfc-9766-d0e16ba8764c',
    subscribeKey : 'sub-c-04c32322-6e74-11e6-80e7-02ee2ddab7fe'
  });


  function publishSampleMessage() {
      console.log('Since we\'re publishing on subscribe connectEvent, we\'re sure we\'ll receive the following publish.');
      var publishConfig = {
          channel : 'hello_world',
          message : 'Hello from PubNub Docs!'
      };
      pubnub.publish(publishConfig, function(status, response) {
          console.log(status, response);
          callback(null, { 'msg': 'hola'});
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
}
