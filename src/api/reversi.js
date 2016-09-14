var fs = require('fs');
var gs = require('./gs.js');
var jwt = require('jsonwebtoken');
var PubNub = require('pubnub');
var https = require('https');
var crypto = require('crypto');
var base64url = require('base64url');
var AWS = require('aws-sdk');

module.exports.login = function(e, ctx, callback, accessToken, callback2) {

    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

    var db = new AWS.SimpleDB();

    if (accessToken != null) {   // Refresh token
        module.exports.refreshToken(accessToken, callback, (accessToken) => {
            callback2(accessToken);
            return;
        });
        return;
    } else if ('inviteCode' in e) { // Sign in with an invitation
        module.exports.googleSignIn(e, ctx, callback, (idToken) => {
            module.exports.acceptInvite(e, ctx, callback, idToken, (invite) => {
                module.exports.createUser(idToken, invite, (accessToken) => {
                    callback2(accessToken, invite);
                });
            });
        });
    } else {    // Sign in to reversi with google
        module.exports.googleSignIn(e, ctx, callback, (idToken) => {
            module.exports.createUser(idToken, null, callback, (accessToken) => {
                callback2(accessToken);
                return;
            });
        });
        return;
    }
};

module.exports.makeAccessToken = function(idToken) {
    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

    var cert = fs.readFileSync('keys/accessTokenKey.pem'); // get private key
    var now = Date.now();
    var randomBytes = crypto.randomBytes(20);
    const hasher = crypto.createHash('sha256');
    hasher.update(randomBytes + now.toString());
    var jti = hasher.digest('base64');
    // console.log(jti);

    var options = {
        algorithm: 'RS256',
        issuer: apiConf.api_prefix + apiConf.api_stage,
        subject: idToken.sub,
        audience: [idToken.sub, apiConf.api_prefix + apiConf.api_stage, gcpConf.frontend_url],
        expiresIn: '1h',
        notBefore: 0,
        jwtid: jti
    };

    var claims = {
        email: idToken.email,
        email_verified: idToken.email_verified,
        name: idToken.name,
        picture: idToken.picture,
        given_name: idToken.given_name,
        family_name: idToken.family_name,
        locale: idToken.locale
    };

    var accessToken = jwt.sign(claims, cert, options);
    return accessToken
};

module.exports.createUser = function(idToken, invite, callback, callback2) {
    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');
    var db = new AWS.SimpleDB();

    var friends = [];
    var games = [];
    if (invite != null) {
        friends = [invite.inviter];
        games = [invite.game];
    }

    db.createDomain({DomainName: 'reversi-user'}, (err, data) => {

        if (err) {
            console.log('error creating domain');
            console.log(JSON.stringify(err));
            callback(err);
            return;
        }

        db.putAttributes({
            DomainName: 'reversi-user',
            ItemName: idToken.sub,
            Attributes: module.exports.serialize({
                name: [idToken.name, false],
                email: [idToken.email, false],
                games: [games, false],
                new: [true, false],
                games_played: [0, false],
                games_won: [0, false],
                friends: [friends, false]
            })
        }, (err, data) => {
            if (err) {
                console.log('error creating user');
                console.log(JSON.stringify(err));
                callback(err);
                return;
            }
            var accessToken = module.exports.makeAccessToken(idToken);
            callback2(accessToken);
        });
    });

};

module.exports.cleanBlacklist = function(callback) {
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');
    var db = new AWS.SimpleDB();

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
                            console.log(JSON.stringify(err)); // an error occurred
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
                            console.log(JSON.stringify(err)); // an error occurred
                        } else {
                            console.log('success on second select');
                            console.log(JSON.stringify(data));  // successful response
                            deleteItems(data);
                        }
                    });
                }

            };
            if ('Items' in data) {
                deleteItems(data);
                callback();
            }
        }
    });

};

module.exports.googleSignIn = function(e, ctx, callback, callback2) {
    var idToken = e.body;
    var idToken = [];

    https.get('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + idToken, function(res) {

        res.on('data', function(chunk) {
            idToken.push(chunk);
        }).on('end', function() {

            if (res.statusCode === 200) {
                idToken = Buffer.concat(idToken).toString();
                idToken = JSON.parse(idToken);

                var key = JSON.parse(fs.readFileSync('keys/googleIdentityPlatform.key'));

                if (key.length > 0 && idToken.aud !== key) {
                    callback({error: 'idToken aud claim is incorrect'});
                    return;
                }
                callback2(idToken);
                return;

            } else {
                callback({error: JSON.stringify(res.statusCode)});
                return;
            }
        });
    }).on('error', function(err) {
        console.log('!!error!!');
        console.log(JSON.stringify(err.errorMessage));

        callback({error: JSON.stringify(err)});
    });
};

module.exports.refreshToken = function(accessToken, callback, callback2) {
    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');
    var db = new AWS.SimpleDB();

    accessToken = module.exports.makeAccessToken(accessToken);

    db.createDomain({DomainName: 'reversi-blacklist'}, (err, data) => {

        if (err) {
            console.log('Error creating domain');
            console.log(JSON.stringify(err));
            callback({error: JSON.stringify(err)});
            return;
        }

        // Clean Blacklist
        module.exports.cleanBlacklist(() => {
            console.log('blacklisting token');
            // Blacklist Token
            module.exports.logout(e, ctx, callback, (data) => {
                callback2(accessToken);
            });
        })
    });
};

module.exports.logged_in = function(e, ctx, callback, callback2) {

    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

    console.log('!! ' + JSON.stringify(e));

    var accessToken = e.headers['X-Reversi-Auth'].split(' ')[1];
    var cert = fs.readFileSync('keys/accessTokenKey.pem.pub'); // get public key
    var options = {
        algorithms: ['RS256'],
        audience: apiConf.api_prefix + apiConf.api_stage,
        issuer: apiConf.api_prefix + apiConf.api_stage
    }
    console.log('accessToken');
    console.log(accessToken);
    var decoded = jwt.verify(accessToken, cert, options, (err, accessToken) => {
        if (err !== null) {
            console.log(JSON.stringify(err));
            callback({error: JSON.stringify(err)});
            return;
        }

        // Check blacklist
        var db = new AWS.SimpleDB();
        var params = {
          DomainName: 'reversi-blacklist', /* required */
          ItemName: accessToken.jti, /* required */
        //   ConsistentRead: true
        };
        db.getAttributes(params, (err, data) => {
          if (err) {
              console.log(JSON.stringify(err, true)); // an error occurred
              callback({error: JSON.stringify(err)});
              return;
          } else {
              console.log(data);           // successful response
              if ('Attributes' in data) {
                  console.log(JSON.stringify(err));
                  callback(err);
                  return;
              }
              callback2(accessToken);
          }
        });

    });
};

module.exports.logout = function(e, ctx, callback, accessToken, callback2) {

    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

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
      ItemName: accessToken.jti, /* required */
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

module.exports.game = function(e, ctx, callback, accessToken, callback2) {
    // Create new game or load existing game from DB.
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

    var db = new AWS.SimpleDB();

    db.createDomain({DomainName: 'reversi-game'}, (err, data) => {

        if (err) {
            console.log('Error creating domain');
            console.log(JSON.stringify(err));
            callback2(accessToken);
            return;
        }
        console.log('e:');
        console.log(JSON.stringify(e));

        if (JSON.stringify(e.query) === '{}') { // If we want to start a new game.

            console.log('starting new game');

            // Generate a unique game id, and use it as an Item name in a put request to SimpleDB.
            var id = base64url(crypto.createHash('sha256').update(Buffer.concat([crypto.randomBytes(20), new Buffer(Date.now().toString(), 'utf-8')]).toString(), 'utf-8').digest());
            console.log('game: ' + id);

            // Put a new Item into SimpleDB, with the correct attributes for a new game.
            var gameBoard = [];
            for (var i = 0; i < 8; i++) {
                var row = [];
                for (var j = 0; j < 8; j++) {
                    row.push(0);
                }
                gameBoard.push(row);
            }

            console.log(accessToken.name);
            var attrs = module.exports.serialize({
                'board': [gameBoard, false],
                'players': [[accessToken.sub], false],
                'names': [[accessToken.name], false],
                'player_turn': [0, false],
                'status': [0, false],
                'pieces': [[32, 32], false]
            });
            console.log('!!attrs');
            console.log(attrs);

            var params = {
                DomainName: 'reversi-game',
                ItemName: id,
                Attributes: attrs
            };

            db.putAttributes(params, (err, data) => {
                if (err) {
                    console.log(JSON.stringify(err)); // an error occurred
                    callback(err);
                    return;
                } else {
                    // Publish a message on PubNub channel game-<game ID here>, the message should announce that this game has just been created, along with a timestamp.

                    callback2({id: id});
                    return;
                }
            });


        } else {    // If we want to load an ongoing game.

            var id = e.query.game;
            console.log('loading game: ' + id);

            // Try to get an Item from the SimpleDB game domain, whose Name is id. Do this with a direct key lookup, rather than performing a query.
            var params = {
                DomainName: 'reversi-game',
                ItemName: id,
                ConsistentRead: true
            }

            db.getAttributes(params, (err, data) => {
                if (err) {
                    // If Item is not found, return an error to the client and return from this function immediatly.
                    console.log(JSON.stringify(err));
                    callback(err);
                    return;
                }
                console.log('!!data!!');
                console.log(JSON.stringify(data));

                var game = module.exports.unserial(data.Attributes);
                console.log(JSON.stringify(game));
                // If user sub claim is not found in players array, return an error and return from this function.
                var validPlayer = false;
                for (i = 0; i < game.players.length; i++) {
                    if (accessToken.sub === game.players[i]) {
                        validPlayer = true;
                    }
                }
                if (!validPlayer) {
                    callback('player is not in players array');
                    return;
                }


                // Return the Game object to the client.
                module.exports.publish(e, ctx, callback, 'game-' + id, {msg: 'player ' + accessToken.sub + ' is active on game ' + id}, () => {
                    callback(null, {id: id, game: game});
                });
            })
        }
    });
};

module.exports.send_invite = function(e, ctx, callback, accessToken, callback2) {

    // Get invitee email address and game ID from POST body.
    var emailAddress = e.body.email;
    var game = e.body.game;

    console.log('e: ' + JSON.stringify(e));

    // Generate invite code and save in "reversi-invite" SimpleDB domain.
    var inviteCode = base64url(crypto.createHash('sha256').update(Buffer.concat([crypto.randomBytes(20), new Buffer(Date.now().toString(), 'utf-8')]).toString(), 'utf-8').digest());
    console.log('inviteCode: ' + inviteCode);
    console.log('game: ' + game);

    var db = new AWS.SimpleDB();

    db.createDomain({DomainName: 'reversi-invite'}, (err, data) => {

        var params = {
          Attributes: module.exports.serialize({ /* required */
            timestamp: [Date.now().toString(), true],
            game: [game, false],
            inviter: [accessToken.sub, false]
          }),
          DomainName: 'reversi-invite', /* required */
          ItemName: inviteCode /* required */
        };
        db.putAttributes(params, (err, data) => {
          if (err) {
              console.log(JSON.stringify(err)); // an error occurred
          } else {
              console.log(JSON.stringify(data));  // successful response

              // Send email to invitee, with a clickable link in it pointing to the backend route GET /invite.
              var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
              var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));
              AWS.config.loadFromPath('keys/awsClientLibrary.keys');

              var ses = new AWS.SES({
                   region: 'us-east-1'
                });

                var eParams = {
                    Destination: {
                        ToAddresses: [emailAddress]
                    },
                    Message: {
                        Body: {
                            Text: {
                                Data: accessToken.name + ' would like to play Reversi with you. Click here to play: ' + gcpConf.frontend_url + '?invite=' + inviteCode + ' (dev: http://localhost:3000?invite=' + inviteCode + ')' +
                                      '\n\nIf you don\'t want to play, you can ignore this message and the invitation will expire after 30 days.'
                            }
                        },
                        Subject: {
                            Data: accessToken.name + ' invites you to play Reversi.'
                        }
                    },
                    Source: apiConf.email
                };

                console.log('===SENDING EMAIL===');
                var email = ses.sendEmail(eParams, function(err, data){
                    if(err) console.log(JSON.stringify(err));
                    else {
                        console.log('===EMAIL SENT===');
                        console.log(JSON.stringify(data));

                        callback2(data);
                    }
                });
                console.log('EMAIL CODE END');
                console.log('EMAIL: ', email);
          }
        });
    });


    // TODO: Implement PUT /invite route, which will be called by client code from the GET /invite route after the user successfully signs in with Google.
};

module.exports.acceptInvite = function(e, ctx, callback, idToken, callback2) {
    var db = new AWS.SimpleDB();

    db.createDomain({DomainName: 'reversi-invite'}, (err, data) => {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err);
            return;
        }

        db.getAttributes({
            DomainName: 'reversi-invite',
            ItemName: e.body.inviteCode,
        }, (err, data) => {
            if (err) {
                console.log(JSON.stringify(err));
                callback(err);
                return;
            }

            if ('Attributes' in data) {
                // Add invitee to game in db
                var invite = module.exports.unserial(data.Attributes);
                db.createDomain({DomainName: 'reversi-game'}, (err, data) => {
                    if (err) {
                        console.log(JSON.stringify(err));
                        callback(err);
                        return;
                    }

                    db.putAttributes({
                        DomainName: 'reversi-game',
                        ItemName: invite.game,
                        Attributes: module.exports.serialize({
                            players: [[invite.inviter, idToken.sub], true]
                        }, (err, data) => {
                            if (err) {
                                console.log(JSON.stringify(err));
                                callback(err);
                                return;
                            }
                            // Add invitee to inviter's friends and vice versa
                            module.exports.createFriendship(invite, idToken, callback, () => {
                                callback2(invite);
                                return;
                            })
                        })
                    });

                })

            } else {
                callback({error: 'invitation not found'});
            }
        });


    });
};

module.exports.createFriendship = function(invite, idToken, callback, callback2) {
    AWS.config.loadFromPath('keys/awsClientLibrary.keys');
    var db = new AWS.SimpleDB();

    db.createDomain({DomainName: 'reversi-friend'}, (err, data) => {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err);
            return;
        }

        db.PutAttributes({
            DomainName: 'reversi-friend',
            ItemName: invite.inviter + '-' + idToken.sub,
                Attributes: module.exports.serialize({
                    name: [idToken.name, false],
                    email: [idToken.email, false],
                    play_count: [0, false],
                    wins: [0, false]
                })
        }, (err, data) => {
                if (err) {
                    console.log(JSON.stringify(err));
                    callback(err);
                    return;
                }

                callback2();
                return;

        });
    });
};

module.exports.getUser = function(e, ctx, callback, accessToken, callback2) {

    AWS.config.loadFromPath('keys/awsClientLibrary.keys');
    var db = new AWS.SimpleDB();

    db.createDomain({DomainName: 'reversi-user'}, (err, data) => {
        if (err != null) {
            console.log(JSON.stringify(err));
            callback(err);
            return;
        }

        db.getAttributes({
            DomainName: 'reversi-user',
            ItemName: accessToken.sub
        }, (err, data) => {
            if (err) {
                console.log(JSON.stringify(err))
                callback({error: err});
                return;
            }
            callback2(data);
        });

        // db.deleteAttributes({
        //     DomainName: 'reversi-user',
        //     ItemName: accessToken.sub,
        // }, (err, data) => {
        //     if (err) {
        //         console.log(JSON.stringify(err));
        //         callback(err);
        //     }
            // callback2({success: true});
        // });
    });
};

module.exports.deleteUser = function(e, ctx, callback, accessToken, callback2) {

    AWS.config.loadFromPath('keys/awsClientLibrary.keys');
    var db = new AWS.SimpleDB();

    db.createDomain({DomainName: 'reversi-user'}, (err, data) => {
        if (err) {
            console.log(JSON.stringify(err));
            callback(err);
            return;
        }

        db.deleteAttributes({
            DomainName: 'reversi-user',
            ItemName: accessToken.sub
        }, (err, data) => {
            if (err) {
                console.log(JSON.stringify(err));
                callback(err);
            }
            callback2();
        });
    });
};

module.exports.serialize = function(obj) {
    var attr = [];

    for (var key in obj) {
        attr.push({
            Name: key,
            Value: JSON.stringify(obj[key][0]),
            Replace: obj[key][1]
        });
    }
    return attr;
};

module.exports.unserial = function(attr) {
    var obj = {};

    for (var i = 0; i < attr.length; i++) {
        obj[attr[i].Name] = JSON.parse(attr[i].Value);
    }
    return obj;
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
