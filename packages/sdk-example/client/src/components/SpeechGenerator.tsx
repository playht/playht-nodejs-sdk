import React, { useRef, useState } from 'react';
import { generateSpeech } from '../API/tts.requests';
import { Spinner } from './Spinner';
import { Voice } from '../hooks/useVoices';

export const SpeechGenerator: React.FC<{ selectedVoice: Voice }> = ({ selectedVoice }) => {
  const [text, setText] = useState<string>(
    "Immersed in the text's pages, I journeyed through a world woven with words and imagination."
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const audioElementRef = useRef<HTMLAudioElement>(null);

  const handleGenerateSpeech = async () => {
    if (!audioElementRef.current) return;
    setLoading(true);
    setAudioURL('');
    try {
      const apiResponse = await generateSpeech(text, selectedVoice);
      setAudioURL(apiResponse.audioUrl);

      const audioElement = audioElementRef.current;
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElementRef.current.load();

      const playAudio = () => {
        audioElement.play();
        setLoading(false);
      };

      const onError = () => {
        setLoading(false);
        console.error('Error loading audio');
      };

      audioElement.addEventListener('loadeddata', playAudio);
      audioElement.addEventListener('error', onError);

      return () => {
        audioElement.removeEventListener('loadeddata', playAudio);
        audioElement.removeEventListener('error', onError);
      };
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
        <button
          onClick={handleGenerateSpeech}
          disabled={loading}
          className="px-4 py-2 disabled:text-neutral-500 bg-green-600 text-white font-bold text-xl enabled:hover:bg-green-400 transition-all rounded"
        >
          <div role="status" className="inline-flex h-full w-full items-center justify-center">
            {loading && <Spinner />} <span className="bold">Generate Speech</span>
          </div>
        </button>
      </div>
      <div className="mt-4">
        <audio id="audioPlayer" controls ref={audioElementRef} className="w-full" src={audioURL}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};
