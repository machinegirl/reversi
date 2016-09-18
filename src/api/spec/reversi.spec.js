describe('The backend Reversi library', () => {

    beforeEach(() => {
        this.reversi = require('../reversi.js');
    });

    describe('reversi.makeAccessToken()', () => {

        it('requires sub claim', () => {
            var f = this.reversi.makeAccessToken.bind(this, {
                sub: '',
                email: '',
                email_verified: true,
                name: '',
                picture: '',
                given_name: '',
                family_name: '',
                locale: ''
            });
            expect(f).toThrow();
        });

        it('returns something', () => {
            expect(this.reversi.makeAccessToken({
                sub: 'dirk',
                email: '',
                email_verified: true,
                name: '',
                picture: '',
                given_name: '',
                family_name: '',
                locale: ''
            })).toBeTruthy();
        });

        it('returns an access token containing claims from the input', (done) => {
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
                expect(o).toEqual(jasmine.objectContaining(i));
                done();
            });
        });
    });
});
