import { init } from './index';

test('exists', () => {
  expect(init('a', 'b')).toBeUndefined();
});
