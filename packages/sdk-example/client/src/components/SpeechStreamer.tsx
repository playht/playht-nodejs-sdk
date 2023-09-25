import { useRef, useState } from 'react';
import { Voice } from '../hooks/useVoices';
import { Spinner } from './Spinner';
import { CONFIG } from '../config';

export const SpeechStreamer: React.FC<{ selectedVoice: Voice }> = ({ selectedVoice }) => {
  const [text, setText] = useState<string>(
    'The clear, babbling stream meandered through the lush, sunlit meadow, creating a soothing and tranquil atmosphere.'
  );
  const [isGeneratingStream, setIsGeneratingStream] = useState<boolean>(false);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string>('');

  const handleStreamSpeech = () => {
    if (!audioElementRef.current) return;
    const onError = () => {
      setIsGeneratingStream(false);
      console.error('Error loading audio');
    };
    try {
      const audioElement = audioElementRef.current;
      audioElement.pause();
      audioElement.currentTime = 0;

      const searchParams = new URLSearchParams();
      searchParams.set('text', text);
      searchParams.set('voiceId', selectedVoice.id);
      searchParams.set('voiceEngine', selectedVoice.voiceEngine);
      setAudioSrc(`${CONFIG.BACKEND_HOST_URL}/streamSpeech?${searchParams.toString()}`);
      setIsGeneratingStream(true);

      audioElement.load();

      const playAudio = () => {
        audioElement.play();
        setIsGeneratingStream(false);
      };

      audioElement.addEventListener('loadeddata', playAudio);
      audioElement.addEventListener('error', onError);

      return () => {
        audioElement.removeEventListener('loadeddata', playAudio);
        audioElement.removeEventListener('error', onError);
      };
    } catch (error) {
      onError();
    }
  };

  return (
    <div className="my-4">
      <h2 className="text-2xl font-semibold">Stream speech from text</h2>
      <div className="mt-2">
        <label className="block text-lg">Enter text to stream:</label>
      </div>
      <div className="mt-2">
        <textarea
          id="streamTextToGenerate"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-64 bg-inherit resize-none border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        ></textarea>
      </div>
      <div className="mt-2">
        <button
          onClick={handleStreamSpeech}
          disabled={isGeneratingStream}
          className="px-4 py-2 disabled:text-neutral-500 bg-green-600 text-white font-bold text-xl enabled:hover:bg-green-400 transition-all rounded"
        >
          <div role="status" className="inline-flex h-full w-full items-center justify-center">
            {isGeneratingStream && <Spinner />} <span className="bold">Stream Speech</span>
          </div>
        </button>
      </div>
      <div className="mt-4">
        <audio id="streamAudioPlayer" controls ref={audioElementRef} className="w-full" src={audioSrc}>
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
};
