var reversi = require('./reversi.js');

module.exports.send_invite = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.send_invite(e, ctx, callback, accessToken, () => {
            callback(null, {success: true});
        });
    });
};

module.exports.accept_invite = (e, ctx, callback) => {
    reversi.login(e, ctx, callback, null, (accessToken, invite) => {
        callback(null, {'invite': invite, 'accessToken': accessToken});
    });
}

module.exports.cancel_invite = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.cancel_invite(e, ctx, callback, accessToken, () => {
            callback(null, {succes: true});
        });
    });
}
