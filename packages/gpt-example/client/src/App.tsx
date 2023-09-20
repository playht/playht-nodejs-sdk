import { useEffect, useRef, useState } from 'react';
import './App.css';
import { PlayhtLogo } from './components/PlayhtLogo';
import { Spinner } from './components/Spinner';

const DEFAULT_TEXT = 'In a few sentences, what is the meaning of life?';

function App() {
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [prompt, setPrompt] = useState<string>(DEFAULT_TEXT);
  const [loading, setLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    const audioElement = audioRef.current;
    if (audioElement === null) return;

    const playAudio = () => {
      audioElement.play();
      setLoading(false);
    };

    audioElement.addEventListener('canPlay', playAudio);

    return () => {
      audioElement.removeEventListener('canPlay', playAudio);
    };
  }, [audioSrc]);

  const sayPrompt = () => {
    const searchParams = new URLSearchParams();
    searchParams.set('prompt', prompt);
    setAudioSrc(`/say-prompt?${searchParams.toString()}`);
    setLoading(true);
  };

  return (
    <>
      <PlayhtLogo />
      <h1 className="pb-8">PlayHT SDK ChatGPT Example</h1>

      <div className="font-bold text-lg">Enter prompt for ChatGPT</div>
      <textarea
        className="w-full h-32 bg-inherit resize-none border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div className="py-4">
        <button
          className="disabled:text-neutral-500 py-4 px-8"
          onClick={sayPrompt}
          disabled={loading || !prompt || prompt.length === 0}
        >
          <div role="status" className={`inline-flex h-full w-full items-center justify-center`}>
            {loading && <Spinner />} <span className="bold">Speak</span>
          </div>
        </button>
      </div>
      <p>
        <audio className="w-full" ref={audioRef} controls src={audioSrc} />
      </p>
    </>
  );
}

export default App;
