import PlayHTAPI from './index';

test('exists', () => {
  expect(new PlayHTAPI('a', 'b')).toBeUndefined();
});
