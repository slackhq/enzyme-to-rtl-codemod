describe('Test suite', () => {
    it('test case 1', () => {});
    it.each([1, 2, 3])('test case 2', (num) => {});
    test('test case 3', () => {});
    test.each([4, 5, 6])('test case 4', (num) => {});
});
