import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const PUNCTUATION_REGEX = /[.!?:…]/;

const openai = new OpenAI({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function* streamGptResponse(prompt: string): AsyncGenerator<string> {
  // Create a stream of GPT-3 responses
  const chatGptResponseStream = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
    stream: true,
  });

  let chatGptText = '';
  for await (const part of chatGptResponseStream) {
    chatGptText += part.choices[0]?.delta?.content || '';

    // Yield each sentence in the response
    const punctuationMatch = chatGptText.match(PUNCTUATION_REGEX);
    if (punctuationMatch && punctuationMatch.index !== undefined) {
      const sentence = chatGptText.substring(0, punctuationMatch.index + 1);
      chatGptText = chatGptText.substring(punctuationMatch.index + 1);
      yield sentence.trim();
    }
  }

  // Yield the last sentence in the response
  if (chatGptText) {
    yield chatGptText + '.';
  }
}
