import * as PlayHTAPI from './index';

test('exists', () => {
  expect(PlayHTAPI.init).toBeDefined();
  expect(typeof PlayHTAPI.generateSpeech).toBe('function');
});
