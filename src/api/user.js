var reversi = require('./reversi.js');

module.exports.delete = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        reversi.deleteUser(e, ctx, callback, accessToken, () => {
            callback(null, {success: true});
        })
    });
};
