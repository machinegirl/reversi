var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {

    reversi.logged_in(e, ctx, callback, () => {

        // TODO: Create new game or load existing game from DB.

        console.log('e:');
        console.log(JSON.stringify(e));

        // Declare a new variable here which will hold our SimpleDB Item.

        if (JSON.stringify(e.query) === '{}') { // If we want to start a new game.

            console.log('starting new game');

            // Generate a unique game id, and use it as an Item name in a put request to SimpleDB.

            // Put a new Item into SimpleDB, with the correct attributes for a new game.

            // Publish a message on PubNub channel game-<game ID here>, the message should announce that this game has just been created, along with a timestamp.

        } else {    // If we want to load an ongoing game.

            let id = e.query.id;
            console.log('loading game: ' + id);

            // Try to get an Item from the SimpleDB game domain, whose Name is id. Do this with a direct key lookup, rather than performing a query.

            // If Item is not found, return an error to the client and return from this function immediatly.
        }

        // Convert the SimpleDB Item to the kind of Game object which is useful to the game engine and client.

        // Return the Game object to the client.

        // TODO: Implement /invite route, which will allow the user to invite an opponent into their game (by email, or sub claim if they've played together before).
        // TODO: Implement /accept route, which will allow the invited user to accept the invitation to play.

        reversi.publish(e, ctx, callback, 'game-xxxzzz', {msg: 'player Z is active on game xxxzzz'}, () => {
            callback(null, {id: "xxxzzz"});
        });
    });
};
