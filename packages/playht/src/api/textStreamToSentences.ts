import { Readable } from 'stream';

const PUNCTUATION_REGEX = /[.!?:…]/;

export function textStreamToSentences(inputStream: NodeJS.ReadableStream): NodeJS.ReadableStream {
  let textInput = '';
  const readableStream = new Readable({
    read() {},
  });

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
        readableStream.push(trimmedSentence);
      }
      punctuationMatch = textInput.match(PUNCTUATION_REGEX);
    }
  });

  // Send the last sentence in the response
  inputStream.on('end', () => {
    if (textInput) {
      readableStream.push(`${textInput}.`);
    }
    readableStream.push(null);
  });

  return readableStream;
}
