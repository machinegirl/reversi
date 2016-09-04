var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {

    reversi.login(e, ctx, callback, (accessToken) => {
        callback(null, {
            'success': true,
            'accessToken': accessToken
        });
    });
}
