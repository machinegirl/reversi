var fs = require('fs');
var gs = require('./gs.js');
var jwt = require('jsonwebtoken');
var PubNub = require('pubnub');
var https = require('https');
var crypto = require('crypto');
var base64url = require('base64url');
var AWS = require('aws-sdk');

AWS.config.loadFromPath('keys/awsClientLibrary.keys');
module.exports.db = new AWS.SimpleDB();

module.exports.login = function(e, ctx, callback, accessToken, callback2) {

    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));


    var db = module.exports.db;

    if (accessToken != null) {   // Refresh token
        module.exports.refreshToken(e, ctx, callback, accessToken, (accessToken) => {
            callback2(accessToken);
            return;
        });
        return;
    } else if ('body' in e && 'inviteCode' in e.body) { // Sign in with an invitation
        console.log('signing in to reversi');
        console.log(e.body);
        module.exports.googleSignIn(e.body, ctx, callback, (idToken) => {
            console.log('sign in success, accepting invite');
            module.exports.acceptInvite(e, ctx, callback, idToken, (invite) => {
                console.log('accepted invite, creating user');
                module.exports.createUser(idToken, invite, callback, (accessToken) => {
                    callback2(accessToken, invite);
                });
            });
        });
    } else {    // Sign in to reversi with google
        console.log('sign in to reversi');
        module.exports.googleSignIn(e, ctx, callback, (idToken) => {
            console.log('sign in success');
            console.log(idToken);
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
    console.log('makeAccessToken accessToken:');
    console.log(accessToken);
    return accessToken;
};

module.exports.createUser = function(idToken, invite, callback, callback2) {
    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));

    var db = module.exports.db;

    console.log('createUser invite');
    console.log(invite)

    var user = {
        name: [idToken.name, true],
        email: [idToken.email, true],
    };

    if (invite != null) {
        user['friend'] = [invite.inviter, false];
        user['game'] = [invite.game, false];
    }

    console.log('user');
    console.log(user);

    db.createDomain({DomainName: 'reversi-user'}, (err, data) => {

        if (err) {
            console.log('error creating reversi-user domain');
            console.log(JSON.stringify(err));
            // callback({error: err});
            // return;
        }

        db.putAttributes({ // Update the user's name and email in our database
            DomainName: 'reversi-user',
            ItemName: idToken.sub,
            Attributes: module.exports.serialize(user),
        }, (err, data) => {
            if (err) {
                console.log('error creating user');
                console.log(JSON.stringify(err));
                callback(err);
                return;
            }
            console.log(data);
            db.putAttributes({ // add some new user state if it doesn't exist
                DomainName: 'reversi-user',
                ItemName: idToken.sub,
                Attributes: module.exports.serialize({
                    new: [true, true],
                    games_played: [0, true],
                    games_won: [0, true]
                }),
                Expected: {
                    Exists: false,
                    Name: 'new'
                }
            }, (err, data) => {
                var accessToken = module.exports.makeAccessToken(idToken);
                callback2(accessToken);
            });
        });
    });

};

module.exports.cleanBlacklist = function(callback) {

    var db = module.exports.db;

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
            return;
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
                console.log('data to delete:');
                console.log(data.Items);
                deleteItems(data);
                callback();
                return;
            } else {
                console.log('blacklist clean!');
                callback();
                return;
            }
        }
    });

};

module.exports.googleSignIn = function(e, ctx, callback, callback2) {
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
                    callback({error: 'idToken aud claim is incorrect'});
                    return;
                }
                callback2(body);
                return;

            } else {
                console.log('status code not 200');
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

module.exports.refreshToken = function(e, ctx, callback, accessToken, callback2) {
    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));
    var gcpConf = JSON.parse(fs.readFileSync('keys/googleCloudPlatform.conf'));

    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-blacklist'}, (err, data) => {

        if (err) {
            console.log('Error creating reversi-blacklist domain');
            console.log(JSON.stringify(err));
            // callback({error: JSON.stringify(err)});
            // return;
        }

        // Clean Blacklist
        module.exports.cleanBlacklist(() => {
            console.log('blacklisting token');
            // Blacklist Token
            module.exports.logout(e, ctx, callback, accessToken, (data) => {
                accessToken = module.exports.makeAccessToken(accessToken);
                console.log('successful logout');
                callback2(accessToken);
            });
        })
    });
};

module.exports.logged_in = function(e, ctx, callback, callback2) {

    var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));


    console.log('logged_in e: ' + JSON.stringify(e));

    var accessToken = e.headers['X-Reversi-Auth'].split(' ')[1];
    var cert = fs.readFileSync('keys/accessTokenKey.pem.pub'); // get public key
    var options = {
        algorithms: ['RS256'],
        audience: apiConf.api_prefix + apiConf.api_stage,
        issuer: apiConf.api_prefix + apiConf.api_stage
    }

    console.log('logged_in accessToken:');
    console.log(accessToken);
    var decoded = jwt.verify(accessToken, cert, options, (err, accessToken) => {
        if (err !== null) {
            console.log(JSON.stringify(err));
            callback({error: JSON.stringify(err)});
            return;
        }

        // Check blacklist
        var db = module.exports.db;
        var params = {
          DomainName: 'reversi-blacklist', /* required */
          ItemName: accessToken.jti, /* required */
        //   ConsistentRead: true
        };
        db.getAttributes(params, (err, data) => {
          if (err) {
              console.log(JSON.stringify(err)); // an error occurred
              callback({error: JSON.stringify(err)});
              return;
          } else {
              console.log('reversi-blacklist data: ' + JSON.stringify(data));           // successful response
              if ('Attributes' in data) {
                  var errMsg = 'logged_in failed: accessToken found in blacklist';
                  console.log(JSON.stringify(errMsg));
                  callback({error: errMsg});
                  return;
              }
              callback2(accessToken);
          }
        });

    });
};

module.exports.logout = function(e, ctx, callback, accessToken, callback2) {

    console.log('logging out: ' + accessToken.jti);

    var db = module.exports.db;
    params = {
        DomainName: 'reversi-blacklist',
        ItemName: accessToken.jti,
        Attributes: [
        {
          Name: 'timestamp',
          Value: Date.now().toString(),
          Replace: true
        },
      ],
    };
    db.putAttributes(params, (err, data) => {
      if (err) {
          console.log(JSON.stringify(err));
          callback({error: err});
          return;
      } else {
        //   console.log(data);  // successful response
          callback2(data);
      }
    });
};

module.exports.game = function(e, ctx, callback, accessToken, callback2) {
    // Create new game or load existing game from DB.


    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-game'}, (err, data) => {

        if (err) {
            console.log('Error creating reversi-game domain');
            console.log(JSON.stringify(err));
            // callback2(accessToken);
            // return;
        }
        console.log('e:');
        console.log(JSON.stringify(e));

        if (JSON.stringify(e.query) === '{}') { // If we want to start a new game.

            console.log('starting new game');

            // Generate a unique game id, and use it as an Item name in a put request to SimpleDB.
            var id = base64url(crypto.createHash('sha256').update(Buffer.concat([crypto.randomBytes(20), new Buffer(Date.now().toString(), 'utf-8')]).toString(), 'utf-8').digest());
            console.log('game: ' + id);

            // Put a new Item into SimpleDB, with the correct attributes for a new game.
            var game = {
                'player-0': [accessToken.sub, true],
                player_turn: [0, true],
                status: [0, true],
                'pieces-0': [32, true],
                'pieces-1': [32, true]
            };
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    game['board-' + i + '-' + j] = [0, true];
                }
            }

            console.log(accessToken.name);
            var attrs = module.exports.serialize(game);
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
                    callback({error: err});
                    return;
                } else {
                    db.putAttributes({
                        DomainName: 'reversi-user',
                        ItemName: accessToken.sub,
                        Attributes: module.exports.serialize({
                            game: [id, false]
                        })
                    }, (err, data) => {
                        if (err) {
                            console.log(JSON.stringify(err)); // an error occurred
                            callback({error: err});
                            return;
                        }
                        // Publish a message on PubNub channel game-<game ID here>, the message should announce that this game has just been created, along with a timestamp.
                        module.exports.publish(e, ctx, callback, 'game-' + id, {msg: 'player ' + accessToken.sub + ' created game ' + id + ' at timestamp ' + Date.now()}, () => {
                            callback2({id: id});
                            return;
                        });
                    })
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
                if (accessToken.sub === game['player-0'] || accessToken.sub === game['player-1']) {
                    validPlayer = true;
                }
                if (!validPlayer) {
                    callback('player is not valid');
                    return;
                }


                // Return the Game object to the client.
                module.exports.publish(e, ctx, callback, 'game-' + id, {msg: 'player ' + accessToken.sub + ' is active on game ' + id}, () => {
                    callback2({id: id, game: game});
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

    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-invite'}, (err, data) => {

        if (err) {
            console.log('Error creating reversi-game domain');
            console.log(JSON.stringify(err));
            // callback2(accessToken);
            // return;
        }

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
};

module.exports.acceptInvite = function(e, ctx, callback, idToken, callback2) {

    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-invite'}, (err, data) => {
        if (err) {
            console.log('error creating reversi-invite domain');
            console.log(JSON.stringify(err));
            // callback({error: JSON.stringify(err)});
            // return;
        }

        db.getAttributes({
            DomainName: 'reversi-invite',
            ItemName: e.body.inviteCode,
        }, (err, data) => {
            if (err) {
                console.log('error getting invite');
                console.log(JSON.stringify(err));
                callback({error: JSON.stringify(err)});
                return;
            }

            if ('Attributes' in data) {
                console.log('Attributes');
                console.log(data.Attributes);
                // Add invitee to game in db
                var invite = module.exports.unserial(data.Attributes);
                console.log('acceptInvite invite');
                console.log(invite);

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
                                'player-1': [idToken.sub, false]
                            })
                        }, (err, data) => {
                            if (err) {
                                console.log('error putting players into game');
                                console.log(JSON.stringify(err));
                                callback(err);
                                return;
                            }
                            // Add invitee to inviter's friends and vice versa
                            console.log('creating friendship');
                            module.exports.createFriendship(invite, idToken, callback, () => {
                                console.log('successfully created friendship');
                                callback2(invite);
                                return;
                            });
                    });

                })

            } else {
                console.log('invitation not found');
                callback({error: 'invitation not found'});
            }
        });


    });
};

module.exports.createFriendship = function(invite, idToken, callback, callback2) {

    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-friend'}, (err, data) => {
        if (err) {
            console.log('failed to create reversi-friend');
            console.log(JSON.stringify(err));
            // callback({error: err});
            // return;
        }

        db.select({SelectExpression: "select * from `reversi-friend` where itemName() in ('" + invite.inviter + '-' + idToken.sub + "', '" + idToken.sub + '-' + invite.inviter + "')"}, (err, data) => {
            if (err) {
                console.log('error selecting from reversi-friend');
                console.log(JSON.stringify(err));
                callback(err);
                return;
            }

            console.log('reversi-friend select data');
            console.log(data);
            if ('Items' in data) { // Found at least one friends record
                var inviterInvitee = false;
                var inviteeInviter = false;
                for (var i = 0; i < data.Items.length; i++) {
                    var item = data.Items[i];
                    if (item.Name === (invite.inviter + '-' + idToken.sub)) {
                        console.log('inviterInvitee record found');
                        inviterInvitee = true;
                    } else  if (item.Name === (idToken.sub + '-' + invite.inviter)) {
                        inviteeInviter = true;
                        console.log('inviteeInviter record found');
                    }
                }

                if (inviterInvitee && inviteeInviter) { // Found both friends records
                    console.log('found both friends records');
                    callback2();
                    return;
                }

                if (!inviterInvitee) { // Make new inviterInvitee
                    console.log('make new inviterInvitee');
                    db.putAttributes({
                        DomainName: 'reversi-friend',
                        ItemName: invite.inviter + '-' + idToken.sub,
                        Attributes: module.exports.serialize({
                            name: [idToken.name, true],
                            email: [idToken.email, true],
                            play_count: [0, true],
                            wins: [0, true]
                        })
                    }, (err, data) => {
                        if (err) {
                            console.log('error putting inviterInvitee into reversi-friend');
                            console.log(JSON.stringify(err));
                            callback(err);
                            return;
                        }
                        callback2();
                        return;
                    });
                } else { // Make new inviteeInviter
                    console.log('make new inviteeInviter');
                    module.exports.getUserBySub(invite.inviter, callback, (user) => {
                        db.putAttributes({
                            DomainName: 'reversi-friend',
                            ItemName: idToken.sub + '-' + invite.inviter,
                            Attributes: module.exports.serialize({
                                name: [user.name, true],
                                email: [user.email, true],
                                play_count: [0, true],
                                wins: [0, true]
                            })
                        }, (err, data) => {
                            if (err) {
                                console.log('error putting inviterInvitee into reversi-friend');
                                console.log(JSON.stringify(err));
                                callback(err);
                                return;
                            }
                            callback2();
                            return;
                        });
                    });
                }
            } else { // Make new inviterInvitee and inviteeInviter
                console.log('make new inviterInvitee and inviteeInviter');
                module.exports.getUserBySub(invite.inviter, callback, (user) => {
                    db.batchPutAttributes({
                        DomainName: 'reversi-friend',
                        Items: [
                            {
                                Name: invite.inviter + '-' + idToken.sub,
                                Attributes: module.exports.serialize({
                                    name: [idToken.name, true],
                                    email: [idToken.email, true],
                                    play_count: [0, true],
                                    wins: [0, true]
                                })
                            },
                            {
                                ItemName: idToken.sub + '-' + invite.inviter,
                                Attributes: module.exports.serialize({
                                    name: [user.name, true],
                                    email: [user.email, true],
                                    play_count: [0, true],
                                    wins: [0, true]
                                })
                            }
                        ]
                    }, (err, data) => {
                        if (err) {
                            console.log('error putting inviterInvitee into reversi-friend');
                            console.log(JSON.stringify(err));
                            callback(err);
                            return;
                        }
                        callback2();
                        return;
                    });
                });
            }
        });
    });
};

module.exports.getUser = function(e, ctx, callback, accessToken, callback2) {
    module.exports.getUserBySub(accessToken.sub, callback, callback2);
};

module.exports.getUserBySub = function(sub, callback, callback2) {
    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-user'}, (err, data) => {
        if (err != null) {
            console.log('error creating reversi-user domain');
            console.log(JSON.stringify(err));
            // callback(err);
            // return;
        }

        db.getAttributes({
            DomainName: 'reversi-user',
            ItemName: sub
        }, (err, data) => {
            if (err) {
                console.log(JSON.stringify(err))
                callback({error: err});
                return;
            }

            // console.log('getUser data: ' + JSON.stringify(data));
            callback2(module.exports.unserial(data.Attributes));
        });
    });
}

module.exports.deleteUser = function(e, ctx, callback, accessToken, callback2) {


    var db = module.exports.db;

    db.createDomain({DomainName: 'reversi-user'}, (err, data) => {
        if (err) {
            console.log('error creating reversi-user domain');
            console.log(JSON.stringify(err));
            // callback(err);
            // return;
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

module.exports.getFriend = function(e, ctx, callback, accessToken, callback2) {

    console.log('getFriend');

    if (e.query == null || e.query.friend == null) {
        console.log('Error: Missing friend query param');
        callback({error: 'missing friend query param'});
        return;
    }

    var db = module.exports.db;

    var friends = JSON.parse(e.query.friend);

    console.log('query.friend: ' + e.query.friend);
    console.log('friends:');
    console.log(friends);

    var names = "'" + friends[0] + '-' + accessToken.sub + "', ";
    if (friends.length > 2) {
        for (var i = 1; i < friends.length-1; i++) {
            names += "'" + friends[i] + '-' + accessToken.sub + "', ";
        }
    }
    names += "'" + friends[friends.length-1] + '-' + accessToken.sub + "'";

    console.log('names: ' + names);

    var res = [];

    var f = (nextToken) => {
        var params = {
          SelectExpression: "select * from `reversi-friend` where itemName() in (" + names + ")", /* required */
        };

        if (nextToken) {
            params.NextToken = nextToken;
        }

        db.select(params, function(err, data) {
            if (err) {
                console.log('error on first select');
                console.log(err, err.stack); // an error occurred
                return;
            }

            console.log('select from reversi-friend data: ' + JSON.stringify(data));
            // res.push(module.exports.unserial(data.Attributes));

            if ('Items' in data) {
                res = res.concat(data.Items);
            }

            if ('NextToken' in data) {
                f(data.NextToken);
                return;
            }

            var res2 = [];

            var parties = res[0].Name.split('-');
            console.log('parties 1: ' + parties);
            var requestee = parties[0];
            var requester = parties[1];

            names = "'" + requester + '-' + requestee + "'";
            if (res.length > 1) {
                names += ", ";
            }
            if (res.length > 2) {
                for (var i = 1; i < res.length-1; i++) {
                    parties = res[i].Name.split('-');
                    console.log('parties 2: ' + parties);
                    requestee = parties[0];
                    requester = parties[1];
                    names += "'" + requester + '-' + requestee + "', ";
                }
            } else if (res.length > 1) {
                parties = res[res.length-1].Name.split('-');
                console.log('parties 3: ' + parties);
                requestee = parties[0];
                requester = parties[1];
                names += "'" + requester + '-' + requestee + "'";
            }

            console.log('names 2: ' + names);

            var f2 = (nextToken) => {
                var params = {
                  SelectExpression: "select * from `reversi-friend` where itemName() in (" + names + ")", /* required */
                };

                if (nextToken) {
                    params.NextToken = nextToken;
                }

                db.select(params, function(err, data) {
                    if (err) {
                        console.log('error on first select');
                        console.log(err, err.stack); // an error occurred
                        return;
                    }

                    console.log('select from reversi-friend data 2: ' + JSON.stringify(data));
                    // res.push(module.exports.unserial(data.Attributes));

                    if ('Items' in data) {
                        res2 = res2.concat(data.Items);
                    }

                    if ('NextToken' in data) {
                        f2(data.NextToken);
                        return;
                    }

                    var res3 = [];

                    for (var i = 0; i < res2.length; i++) {

                        if ('Attributes' in res2[i]) {
                            var obj = {};
                            obj[res2[i].Name] = module.exports.unserial(res2[i].Attributes);
                            res3.push(obj);
                        }
                    }

                    callback2(res3);
                });
            }
            f2();
        });
    }
    f();

    // Make a list of mutual friendships
    // var mutual = [];
    // for (var i = 0; i < friends.length; i++) {

        // console.log('iter: ' + i);

        // ((i, callback3) => {

            // console.log('iter func: ' + i);

            // var friend = friends[i];

            // db.getAttributes({
            //     DomainName: 'reversi-friend',
            //     ItemName: friend + '-' + accessToken.sub
            // }, (err, data) => {
            //     if (err) {
            //         console.log(JSON.stringify(err))
            //         callback({error: err});
            //         return;
            //     }
            //
            //     // Only add friend if friendship is mutual.
            //     if ('Attributes' in data) {
            //         console.log('mutual friendship');
            //         mutual.push(friend);
            //     }
            //
            //     if (i >= friends.length-1) {
            //         console.log('last iter');
            //         callback3(mutual);
            //         return;
            //     }
            //     // console.log('getFriend data: ' + JSON.stringify(data));
            //     // callback2(module.exports.unserial(data.Attributes));
            // });
        // })(i, (mutual) => {
        //     // if (i >= friends.length-1) {
        //
        //         console.log('callback3');
        //         console.log('mutual: ' + JSON.stringify(mutual));
        //
        //         var names = "'" + mutual[0] + "', ";
        //         for (var i = 1; i < mutual.length-1; i++) {
        //
        //             names += "'" + mutual[i] + "', ";
        //         }
        //         names += "'" + mutual[mutual.length-1] + "'";
        //
        //         console.log('names: ' + names);
        //
        //         var res = [];
        //
        //         var f = (nextToken, callback) => {
        //
        //             console.log('f');
        //
        //             var params = {
        //               SelectExpression: "select * from `reversi-friend` where itemName() in (" + names + ")", /* required */
        //             };
        //
        //             if (nextToken) {
        //                 params.NextToken = nextToken;
        //             }
        //
        //             db.select(params, function(err, data) {
        //                 if (err) {
        //                     console.log('error on first select');
        //                     console.log(err, err.stack); // an error occurred
        //                     return;
        //                 }
        //
        //                 console.log('select from reversi-friend data: ' + JSON.stringify(data));
        //                 // res.push(module.exports.unserial(data.Attributes));
        //
        //                 res.concat(data);
        //
        //                 if ('NextToken' in data) {
        //                     f(data.NextToken);
        //                     return;
        //                 }
        //
        //                 callback2(res);
        //             });
        //         };
        //
        //         f();
            // }
    //
    //     });
    // }


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
    console.log('unserial');
    for (var i = 0; i < attr.length; i++) {
        var val = JSON.parse(attr[i].Value);
        console.log('object on iteration ' + i);
        console.log(obj)
        if (attr[i].Name in obj) {
            // console.log('found duplicate key: ' + attr[i].Name);
            // console.log('type: ' + typeof obj[attr[i].Name]);
            // console.log('value: ' + obj[attr[i].Name]);
            if (obj[attr[i].Name].constructor === Array) {
                console.log('array: ' + JSON.stringify(obj[attr[i].Name]));
                console.log('pushing into array: ' + val);
                obj[attr[i].Name].push(val);
            } else {
                // console.log('key: ' + attr[i].Name);
                // console.log('previous value: ' + obj[attr[i].Name]);
                // console.log('new value: ' + attr[i].Value);
                var newVal = [obj[attr[i].Name], val];
                console.log('try to add at key: ' + attr[i].Name + ' value:');
                console.log(newVal);
                obj[attr[i].Name] = newVal;
                console.log('obj after add: ' + JSON.stringify(obj[attr[i].Name]));
                // console.log(typeof obj[attr[i].Name])
            }
        } else {
            obj[attr[i].Name] = val;
        }
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
