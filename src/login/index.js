https = require('https');

exports.handler = (e, ctx, callback) => {

    var idToken = e.idToken;
    var body = [];
    var success = true;
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
                console.log(body);
                if (body.aud !== '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com') {
                    success = false;
                }
            } else {
                success = false;
            }
            callback(null, {
                'success': success,
            });
        });
    }).on('error', function(err) {
        console.log('!!error!!');
        console.log(err);
        success = false;
        callback(null, {
            'success': success,
            'idToken': null
        });
    });
}
