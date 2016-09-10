var crypto = require('crypto');
var base64url = require('base64url');
var reversi = require('./reversi.js');
var AWS = require('aws-sdk');


module.exports.handler = (e, ctx, callback) => {

    AWS.config.loadFromPath('keys/awsClientLibrary.keys');

    reversi.logged_in(e, ctx, callback, (decoded) => {

        // TODO: Create new game or load existing game from DB.

        var db = new AWS.SimpleDB();

        db.createDomain({DomainName: 'reversi-game'}, (err, data) => {

            if (err) {
                console.log('Error creating domain');
                console.log(err);
                callback2(accessToken);
                return;
            }
            console.log('e:');
            console.log(JSON.stringify(e));

            if (JSON.stringify(e.query) === '{}') { // If we want to start a new game.

                console.log('starting new game');

                // Generate a unique game id, and use it as an Item name in a put request to SimpleDB.
                var id = base64url(crypto.createHash('sha256').update(Buffer.concat([crypto.randomBytes(20), new Buffer(Date.now().toString(), 'utf-8')]).toString(), 'utf-8').digest());
                console.log('id: ' + id);

                // Put a new Item into SimpleDB, with the correct attributes for a new game.
            	var gameBoard = [];
        		for (var i = 0; i < 8; i++) {
        			var row = [];
        			for (var j = 0; j < 8; j++) {
        				row.push(0);
        			}
        			gameBoard.push(row);
        		}

                var params = {
                    DomainName: 'reversi-game',
                    ItemName: id,
                    Attributes: [
                        {
                            Name: 'board',
                            Value: JSON.stringify(gameBoard)
                        },
                        {
                            Name: 'players',
                            Value: JSON.stringify([decoded.sub])
                        },
                        {
                            Name: 'player_turn',
                            Value: '0'
                        },
                        {
                            Name: 'status',
                            Value: '0'
                        },
                        {
                            Name: 'pieces',
                            Value: JSON.stringify([32,32])
                        }
                    ]
                };

                db.putAttributes(params, (err, data) => {
                    if (err) {
                        console.log(err, err.stack); // an error occurred
                        callback(err);
                        return;
                    } else {
                        // Publish a message on PubNub channel game-<game ID here>, the message should announce that this game has just been created, along with a timestamp.

                        callback(null, {'id': id});
                        return;
                    }
                });


            } else {    // If we want to load an ongoing game.

                var id = e.query.id;
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
                        console.log(err);
                        callback(err);
                        return;
                    }
                    console.log('!!data!!');
                    console.log(data);

                    var game = reversi.unserialGame(data.Attributes);
                    // If user sub claim is not found in players array, return an error and return from this function.
                    var validPlayer = false;
                    for (i = 0; i < game.players.length; i++) {
                        if (decoded.sub === game.players[i]) {
                            validPlayer = true;
                        }
                    }
                    if (!validPlayer) {
                        callback('player is not in players array');
                        return;
                    }


                    // Return the Game object to the client.
                    reversi.publish(e, ctx, callback, 'game-' + id, {msg: 'player ' + decoded.sub + ' is active on game ' + id}, () => {
                        callback(null, {id: id, game: game});
                    });
                })


            }



            // TODO: Implement /invite route, which will allow the user to invite an opponent into their game (by email, or sub claim if they've played together before).
            // TODO: Implement /accept route, which will allow the invited user to accept the invitation to play.

        });
    });
};