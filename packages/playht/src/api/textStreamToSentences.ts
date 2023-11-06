import { Readable } from 'stream';
import { GRPC_STREAMING_LIMITS, PUNCTUATION_REGEX, STREAM_SENTENCE_AGGREGATE_TIMEOUT } from './constants';

export function textStreamToSentences(inputStream: NodeJS.ReadableStream): NodeJS.ReadableStream {
  let textInput = '';
  let combinedSentences = '';
  let isFirstSentence = true;
  let timer: NodeJS.Timeout;

  const readableStream = new Readable({
    read() {},
  });

  const pushSentences = () => {
    if (combinedSentences.trim().length > 0) {
      readableStream.push(combinedSentences.trim());
      combinedSentences = '';

      clearTimeout(timer);
      timer = setTimeout(pushSentences, STREAM_SENTENCE_AGGREGATE_TIMEOUT);
    }
  };

  inputStream.on('data', (part) => {
    textInput += `${part.toString()}`;

    let punctuationMatch = textInput.match(PUNCTUATION_REGEX);
    while (punctuationMatch && punctuationMatch.index !== undefined) {
      const sentence = textInput.substring(0, punctuationMatch.index + 1);
      textInput = textInput.substring(punctuationMatch.index + 1);
      const trimmedSentence = sentence.trim();

      if (
        !(trimmedSentence.length === 0 || (trimmedSentence.length === 1 && PUNCTUATION_REGEX.test(trimmedSentence[0]!)))
      ) {
        if (isFirstSentence) {
          readableStream.push(trimmedSentence);
          isFirstSentence = false;
        } else if (combinedSentences.length + trimmedSentence.length > GRPC_STREAMING_LIMITS.LINE_MAX_LENGTH) {
          pushSentences();
          combinedSentences = trimmedSentence;
        } else {
          combinedSentences += ` ${trimmedSentence}`;
          if (combinedSentences.length > GRPC_STREAMING_LIMITS.LINE_DESIRED_LENGTH) {
            pushSentences();
          }
        }
      }
      punctuationMatch = textInput.match(PUNCTUATION_REGEX);
    }
  });

  inputStream.on('error', (err) => {
    readableStream.emit('error', err);
  });

  // Send the last sentence in the response
  inputStream.on('end', () => {
    clearTimeout(timer);
    if (combinedSentences.trim().length > 0) {
      readableStream.push(combinedSentences.trim());
    }
    if (textInput.trim().length > 0) {
      readableStream.push(`${textInput}.`);
    }
    readableStream.push(null);
  });

  return readableStream;
}
