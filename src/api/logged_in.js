var reversi = require('./reversi.js');

module.exports.handler = (e, ctx, callback) => {
    reversi.logged_in(e, ctx, callback, () => {
        callback(null, true);
    });
};
