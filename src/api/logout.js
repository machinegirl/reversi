var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (decoded) => {
        reversi.logout(e, ctx, callback, decoded, (accessToken) => {
            callback(null, true);
        });
    });
};
