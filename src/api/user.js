var reversi = require('./reversi.js');

module.exports.getUser = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.getUser(e, ctx, callback, accessToken, (res) => {
            callback(null, res);
        })
    });
};

module.exports.delete = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.deleteUser(e, ctx, callback, accessToken, () => {
            callback(null, {success: true});
        })
    });
};
