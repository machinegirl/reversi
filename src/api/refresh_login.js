var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.login(e, ctx, callback, accessToken, (accessToken) => {
            callback(null, {
                'success': true,
                'accessToken': accessToken
            });
        });
    });
};
