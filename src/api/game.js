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

                console.log(decoded.name);
                var attrs = reversi.serialize({
                    'board': gameBoard,
                    'players': [decoded.sub],
                    'names': [decoded.name],
                    'player_turn': 0,
                    'status': 0,
                    'pieces': [32, 32]
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
                        console.log(err, err.stack); // an error occurred
                        callback(err);
                        return;
                    } else {
                        // Publish a message on PubNub channel game-<game ID here>, the message should announce that this game has just been created, along with a timestamp.

                        callback(null, {id: id});
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
                        console.log(err);
                        callback(err);
                        return;
                    }
                    console.log('!!data!!');
                    console.log(data);

                    var game = reversi.unserial(data.Attributes);
                    console.log(game);
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
        });
    });
};
