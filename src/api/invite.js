var reversi = require('./reversi.js');

module.exports.send_invite = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.send_invite(e, ctx, callback, accessToken, () => {
            callback(null, true);
        });
    });
};
