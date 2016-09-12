var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.game(e, ctx, callback, accessToken, (res) => {
            callback(null, res);
        });
    });
};
