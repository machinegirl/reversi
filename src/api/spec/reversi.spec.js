describe('The backend Reversi library', () => {

    beforeEach(() => {
        this.reversi = require('../reversi.js');
    });

    describe('reversi.makeAccessToken()', () => {

        it('requires sub claim to be a non-empty string', () => {

            var i = {
                sub: '',
                email: '',
                email_verified: true,
                name: '',
                picture: '',
                given_name: '',
                family_name: '',
                locale: ''
            };

            expect(this.reversi.makeAccessToken.bind(this, i)).toThrow();
            i.sub = null;
            expect(this.reversi.makeAccessToken.bind(this, i)).toThrow();
            i.sub = 9;
            expect(this.reversi.makeAccessToken.bind(this, i)).toThrow();
            i.sub = undefined;
            expect(this.reversi.makeAccessToken.bind(this, i)).toThrow();
            i.sub = {};
            expect(this.reversi.makeAccessToken.bind(this, i)).toThrow();
            i.sub = [];
            expect(this.reversi.makeAccessToken.bind(this, i)).toThrow();
            i.sub = 'dirk';
            expect(this.reversi.makeAccessToken.bind(this, i)).not.toThrow();
        });

        it('returns something', () => {
            var i = {
                sub: 'dirk',
                email: '',
                email_verified: true,
                name: '',
                picture: '',
                given_name: '',
                family_name: '',
                locale: ''
            };

            expect(this.reversi.makeAccessToken(i)).toBeTruthy();
        });

        it('returns an access token containing claims from the input', () => {
            var jwt = require('jsonwebtoken');

            var i = {
                sub: 'dirk01',
                email: 'dirk@pirg.krm',
                email_verified: true,
                name: 'Dirk Pirg',
                picture: 'pic.jpg',
                given_name: 'Dirk',
                family_name: 'Pirg',
                locale: 'en'
            };
            var accessToken = this.reversi.makeAccessToken(i);
            var o = jwt.decode(accessToken);
            if (o === null) {
                fail('error: jwt.decode() failed: ' + JSON.stringify(err));
            }
            expect(o).toEqual(jasmine.objectContaining(i));
        });

        it('returns a valid jwt with a valid signature', (done) => {
            var jwt = require('jsonwebtoken');
            var fs = require('fs');
            var cert = fs.readFileSync('keys/accessTokenKey.pem.pub');
            var apiConf = JSON.parse(fs.readFileSync('keys/api.conf'));

            var options = {
                algorithms: ['RS256'],
                audience: apiConf.api_prefix + apiConf.api_stage,
                issuer: apiConf.api_prefix + apiConf.api_stage
            };

            var i = {
                sub: 'dirk01',
                email: 'dirk@pirg.krm',
                email_verified: true,
                name: 'Dirk Pirg',
                picture: 'pic.jpg',
                given_name: 'Dirk',
                family_name: 'Pirg',
                locale: 'en'
            };
            var accessToken = this.reversi.makeAccessToken(i);
            jwt.verify(accessToken, cert, options, (err, o) => {
                if (err !== null) {
                    done.fail('error: jwt.verify() failed: ' + JSON.stringify(err));
                }
                expect(o).toBeTruthy();
                done();
            });
        });
    });
});
