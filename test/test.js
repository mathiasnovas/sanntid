var sanntid = require('../sanntid');
var expect = require('expect');

describe('sanntid', function () {
    var sofienberg = { id: 3010533,
        name: 'Sofienberg (i Trondheimsvn)',
        FIELD3: 'SOFB',
        hld: 'OSL',
        FIELD5: '1',
        id2: 599041,
        id3: 6644154,
        type: 1
    };

    describe('list', function () {
        it('gets a list of all stops', function () {
            var result = sanntid.list();

            expect(result).toBeA(Array);
            expect(result).toInclude(sofienberg);
        });
    });

    describe('search', function () {
        it('searches for a specific stop', function () {
            var result = sanntid.search('sofienberg');

            expect(result).toBeA(Array);
            expect(result).toEqual([sofienberg]);
        });
    });
});
