import { GRPC_STREAMING_LIMITS, PUNCTUATION_REGEX } from './constants';

export const SHORT_SENTENCE_COUNT = 1;

export function splitSentences(input: string): Array<string> {
  const sentences: Array<string> = [];

  let textInput = input
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/…/g, '.');
  let punctuationMatch = textInput.match(PUNCTUATION_REGEX);
  while (punctuationMatch && punctuationMatch.index !== undefined) {
    const sentence = textInput.substring(0, punctuationMatch.index + 1);
    textInput = textInput.substring(punctuationMatch.index + 1);
    const trimmedSentence = sentence.trim();
    if (
      !(trimmedSentence.length === 0 || (trimmedSentence.length === 1 && PUNCTUATION_REGEX.test(trimmedSentence[0]!)))
    ) {
      sentences.push(trimmedSentence);
    }
    punctuationMatch = textInput.match(PUNCTUATION_REGEX);
  }

  if (textInput) {
    const trimmedSentence = textInput.trim();
    if (
      !(trimmedSentence.length === 0 || (trimmedSentence.length === 1 && PUNCTUATION_REGEX.test(trimmedSentence[0]!)))
    ) {
      sentences.push(trimmedSentence);
    }
  }

  const lines: Array<string> = [];
  let line = '';
  for (const sentence of sentences) {
    if (sentence.length >= GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH) {
      if (line.length > 0) {
        lines.push(line);
        line = '';
      }

      // Sentence too large. Try last comma, then last space.
      const lastComma = sentence.lastIndexOf(',');
      if (lastComma > 0 && lastComma < GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH) {
        const beforeComma = sentence.substring(0, lastComma + 1).trim();
        const afterComma = sentence.substring(lastComma + 1).trim();
        lines.push(beforeComma);
        line = afterComma;
        continue;
      }

      const lastSpace = sentence.lastIndexOf(' ');
      if (lastSpace > 0 && lastSpace < GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH) {
        const beforeComma = sentence.substring(0, lastSpace + 1).trim();
        const afterComma = sentence.substring(lastSpace + 1).trim();
        lines.push(beforeComma);
        line = afterComma;
        continue;
      }

      // Long string with no space or comma
      throw new Error(`Input has long sentence with no space or comma: ${sentence}`);
    } else if ((line + sentence + 1).length <= GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH) {
      line += line.length === 0 ? sentence : ` ${sentence}`;
    } else {
      lines.push(line);
      line = sentence;
    }
  }

  if (line.length > 0) {
    lines.push(line);
  }

  return lines;
}
