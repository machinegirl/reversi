var reversi = require('./reversi.js');

module.exports.send_invite = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.send_invite(e, ctx, callback, accessToken, () => {
            callback(null, {success: true});
        });
    });
};

module.exports.put_invite = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.put_invite(e, ctx, callback, accessToken, (invite) => {
            callback(null, {'invite': invite});
        })
    })
}
