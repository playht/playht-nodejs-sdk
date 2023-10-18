import { GRPC_STREAMING_LIMITS } from '../api/constants';
import { splitSentences } from '../api/sentenceSplit';

const LONG_SENTENCE = `12 ${'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 10)}.`;

describe('splitSentences', () => {
  it('should not split sentences less than max line length', () => {
    const result = splitSentences(LONG_SENTENCE);
    expect(result).toEqual([LONG_SENTENCE]);
  });

  it('should handle an empty string', () => {
    const result = splitSentences('');
    expect(result).toEqual([]);
  });

  it('should handle repeated punctiation', () => {
    const result = splitSentences('Hi... There!!?!');
    expect(result).toEqual(['Hi. There!']);
  });

  it('should replace invalid punctiation and extra spaces', () => {
    const result = splitSentences('I mean… \n\n\n\r     “tomorrow” is what she said…');
    expect(result).toEqual(['I mean. "tomorrow" is what she said.']);
  });

  it('should handle a string without punctuation', () => {
    const result = splitSentences('Hello world');
    expect(result).toEqual(['Hello world']);
  });

  it('should handle a string with multiple sentences', () => {
    const rest = 'How are you? I am fine. Thank you.';
    const result = splitSentences(`${LONG_SENTENCE} ${rest}`);
    expect(result).toEqual([LONG_SENTENCE, rest]);
  });

  it('should throw for a word that exceeds the GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH', () => {
    const longSentence = 'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH + 1);
    expect(() => splitSentences(longSentence)).toThrowError();
  });

  it('should handle a string with no punctuation that is exactly the GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH', () => {
    const longSentence = 'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 1);
    const result = splitSentences(longSentence);
    expect(result).toEqual(['a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 1)]);
  });

  it('should split on commas for long sentences', () => {
    const longSentence = `${'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 1)}, ${'b'.repeat(10)}.`;
    const result = splitSentences(longSentence);
    expect(result).toEqual([`${'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 1)},`, `${'b'.repeat(10)}.`]);
  });

  it('should split on space for long sentences', () => {
    const longSentence = `${'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 1)} ${'b'.repeat(10)}.`;
    const result = splitSentences(longSentence);
    expect(result).toEqual([`${'a'.repeat(GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH - 1)}`, `${'b'.repeat(10)}.`]);
  });
});
