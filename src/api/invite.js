var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.invite(e, ctx, callback, accessToken, () => {
            callback(null, true);
        });
    });
};
