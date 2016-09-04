var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {

    reversi.logged_in(e, ctx, callback, () => {

        // TODO: Create new game or load existing game from DB.

        reversi.publish(e, ctx, callback, 'game-xxxzzz', {msg: 'player Z is active on game xxxzzz'}, () => {
            callback(null, {id: "xxxzzz"});
        });
    });
};
