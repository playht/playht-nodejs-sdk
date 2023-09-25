const PUNCTUATION_REGEX = /[.!?:…]/;
export async function* textStreamToSentences(inputStream: NodeJS.ReadableStream): AsyncGenerator<string> {
  let textInput = '';
  for await (const part of inputStream) {
    textInput += `${part}`;

    // Yield each sentence in the response
    const punctuationMatch = textInput.match(PUNCTUATION_REGEX);
    if (punctuationMatch && punctuationMatch.index !== undefined) {
      const sentence = textInput.substring(0, punctuationMatch.index + 1);
      textInput = textInput.substring(punctuationMatch.index + 1);
      yield sentence.trim();
    }
  }

  // Yield the last sentence in the response
  if (textInput) {
    yield `${textInput}.`;
  }
}
