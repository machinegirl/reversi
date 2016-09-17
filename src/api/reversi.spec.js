describe('The backend Reversi library', () => {

    beforeEach(() => {
        this.reversi = require('./reversi.js');
    });

    describe('makeAccessToken', () => {

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

    });
});
