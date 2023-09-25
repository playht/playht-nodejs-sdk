import React, { useState } from 'react';
import { generateSpeech } from '../API/tts.requests';
import { Spinner } from './Spinner';
import { Voice } from '../hooks/useVoices';

export const SpeechGenerator: React.FC<{ selectedVoice: Voice }> = ({ selectedVoice }) => {
  const [text, setText] = useState<string>(
    "Immersed in the text's pages, I journeyed through a world woven with words and imagination."
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);

  const handleGenerateSpeech = async () => {
    setLoading(true);
    setAudioURL(null);
    try {
      const apiResponse = await generateSpeech(text, selectedVoice);
      setAudioURL(apiResponse.audioUrl);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4">
      <h2 className="text-2xl font-semibold">Generate speech from text</h2>
      <div className="mt-2">
        <label className="block text-lg">Enter text to generate:</label>
      </div>
      <div className="mt-2">
        <textarea
          id="textToGenerate"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 bg-inherit resize-none border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        ></textarea>
      </div>
      <div className="mt-2">
        <button onClick={handleGenerateSpeech} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">
          Generate Speech
        </button>
      </div>
      <div className="mt-2">
        {loading && <Spinner label="Generating speech..." />}
        {audioURL && !loading && (
          <audio id="audioPlayer" controls className="w-full" src={audioURL}>
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
};
