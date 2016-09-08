var fs = require('fs');
var jwt = require('jsonwebtoken');
var PubNub = require('pubnub');
var https = require('https');
var crypto = require('crypto');
var AWS = require('aws-sdk');

module.exports.login = function(e, ctx, callback, decoded, callback2) {

    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

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

        var db = new AWS.SimpleDB();

        db.createDomain({DomainName: 'reversi-blacklist'}, (err, data) => {

            if (err) {
                console.log('Error creating domain');
                console.log(err);
                callback2(accessToken);
                return;
            }

            // Clean Blacklist
            var now = Date.now();
            console.log('now: ' + now);
            var hourAgo = now - (1000 * 60 * 60);
            console.log('hour ago: ' + hourAgo);
            // hourAgo = 0;
            // console.log('4 minutes ago');
            // console.log(hourAgo);
            var params = {
              SelectExpression: "select * from `reversi-blacklist` where timestamp < '" + hourAgo + "'", /* required */
            };
            db.select(params, function(err, data) {
                if (err) {
                    console.log('error on first select');
                    console.log(err, err.stack); // an error occurred
                } else {
                    // console.log('Check timestamp here');
                    console.log('data: ' + JSON.stringify(data));  // successful response


                    var deleteItems = (data) => {

                        console.log('delete items data: ' + JSON.stringify(data));
                        // Delete all items from select operation
                        // console.log('trying to delete items');
                        for (var i = 0; i < data.Items.length; i++) {
                            var item = data.Items[i];
                            // console.log(item);
                            // console.log('Check timestamp here');
                            // console.log(item.Attributes);
                            var params = {
                              DomainName: 'reversi-blacklist', /* required */
                              ItemName: item.Name, /* required */
                            };
                            db.deleteAttributes(params, function(err, data) {
                                if (err) {
                                    console.log('error on delete');
                                    console.log(err, err.stack); // an error occurred
                                } else {
                                    console.log('successful delete');
                                    console.log(data);  // successful response
                                }
                            });
                        }

                        // Check for NextToken and call deleteItems if necessary
                        if ('NextToken' in data) {
                            console.log('next token detected');
                            var params = {
                                SelectExpression: 'select * from `reversi-blacklist` where timestamp < \'' + hourAgo + '\'', /* required */
                                NextToken: data.NextToken
                            };
                            db.select(params, function(err, data) {
                                if (err) {
                                    console.log('error on second select');
                                    console.log(err, err.stack); // an error occurred
                                } else {
                                    console.log('success on second select');
                                    console.log(data);  // successful response
                                    deleteItems(data);
                                }
                            });
                        }

                    };
                    if ('Items' in data) {
                        deleteItems(data);
                    }
                }
            });

            // Blacklist Token
            console.log('blacklisting token');

            module.exports.logout(e, ctx, callback, (data) => {
                callback2(data);
            });

            // console.log('date as number');
            // console.log(Date.now());
            // console.log('date as string');
            // console.log((Date.now()).toString());
            // params = {
            //   Attributes: [ /* required */
            //     {
            //       Name: 'timestamp', /* required */
            //       Value: (Date.now()).toString(), /* required */
            //       Replace: true
            //     },
            //     /* more items */
            //   ],
            //   DomainName: 'reversi-blacklist', /* required */
            //   ItemName: decoded.jti, /* required */
            // //   Expected: {
            // //     Exists: true || false,
            // //     Name: 'STRING_VALUE',
            // //     Value: 'STRING_VALUE'
            // //   }
            // };
            // db.putAttributes(params, (err, data) => {
            //   if (err) {
            //       console.log(err, err.stack); // an error occurred
            //   } else {
            //       console.log(data);  // successful response
            //   }
            // });
        });
        // callback2(accessToken);
    }
};

module.exports.logged_in = function(e, ctx, callback, callback2) {

    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

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

        // TODO: Check blacklist

        var db = new AWS.SimpleDB();

        var params = {
          DomainName: 'reversi-blacklist', /* required */
          ItemName: decoded.jti, /* required */
        //   ConsistentRead: true
        };
        db.getAttributes(params, (err, data) => {
          if (err) {
              console.log(err, err.stack); // an error occurred
              callback(err);
              return;
          } else {
              console.log(data);           // successful response
              callback2(decoded);
          }
        });

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

module.exports.logout = function(e, ctx, callback, decoded, callback2) {
    var db = new AWS.SimpleDB();
    params = {
      Attributes: [ /* required */
        {
          Name: 'timestamp', /* required */
          Value: Date.now().toString(), /* required */
          Replace: true
        },
        /* more items */
      ],
      DomainName: 'reversi-blacklist', /* required */
      ItemName: decoded.jti, /* required */
    //   Expected: {
    //     Exists: true || false,
    //     Name: 'STRING_VALUE',
    //     Value: 'STRING_VALUE'
    //   }
    };
    db.putAttributes(params, (err, data) => {
      if (err) {
          console.log(err, err.stack); // an error occurred
      } else {
          console.log(data);  // successful response
          callback2(data);
      }
    });
};
