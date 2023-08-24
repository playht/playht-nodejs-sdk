import PlayHTAPI from './index';

test('exists', () => {
  const api = new PlayHTAPI('a', 'b');
  expect(api).toBeDefined();
  expect(typeof api.genereateUltraRealisticSpeech).toBe('function');
});
