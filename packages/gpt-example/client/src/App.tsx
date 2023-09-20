import { useState } from 'react';
import './App.css';

function App() {
  const [audioSrc, setAudioSrc] = useState('');

  return (
    <>
      <h1>PlayHT SDK ChatGPT Example</h1>
      <div className="card">
        <button onClick={() => setAudioSrc('/say-prompt')}>Speak</button>
      </div>
      <p>
        <audio autoPlay controls src={audioSrc} />
      </p>
    </>
  );
}

export default App;
