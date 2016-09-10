var https = require('https');

module.exports.gs = function() {
    https.get('https://us-central1-reversi-2016.cloudfunctions.net/react', function(res) {

        // res.on('data', function(chunk) {
        //     body.push(chunk);
        // }).on('end', function() {

            if (res.statusCode === 200) {
                // body = Buffer.concat(body).toString();
                // body = JSON.parse(body);

                // var key = JSON.parse(fs.readFileSync('keys/googleIdentityPlatform.key'));
                //
                // if (key.length > 0 && body.aud !== key) {
                //     callback(null, {
                //         'success': false,
                //         'accessToken': null
                //     });
                //     return;
                // }
                //
                // var accessToken = makeAccessToken(body);
                // callback2(accessToken);

            } else {
                // callback(null, {
                //     'success': false,
                //     'accessToken': null
                // });
                return;
            }
    //     });
    // }).on('error', function(err) {
    //     console.log('!!error!!');
    //     console.log(err);
    //     // success = false;
    //     // callback(null, {
    //     //     'success': success,
    //     //     'accessToken': null
    //     // });
    });
};
