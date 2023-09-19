import OpenAI from 'openai';

const PUNCTUATION_REGEX = /[.!?]/;

const openai = new OpenAI({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_API_KEY,
});

export async function* streamGptResponse(prompt: string) {
  const chatGptResponseStream = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
    stream: true,
  });

  let chatGptText = '';
  for await (const part of chatGptResponseStream) {
    chatGptText += part.choices[0]?.delta?.content || '';

    const match = chatGptText.match(PUNCTUATION_REGEX);
    if (match && match.index !== undefined) {
      const sentence = chatGptText.substring(0, match.index + 1);
      chatGptText = chatGptText.substring(match.index + 1);
      yield sentence;
    }
  }
}
