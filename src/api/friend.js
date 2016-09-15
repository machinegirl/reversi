var reversi = require('./reversi.js');

module.exports.get = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, (accessToken) => {
        // reversi.getUser(e, ctx, callback, accessToken, (res) => {
        //     callback(null, res);
        // });
    });
};
