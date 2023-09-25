import { useState } from 'react';
import { ChooseVoice } from './components/ChooseVoice';
import { SpeechGenerator } from './components/SpeechGenerator';
import { SpeechStreamer } from './components/SpeechStreamer';
import { Voice } from './hooks/useVoices';
import { CloneVoice } from './components/CloneVoice';
import { PlayhtLogo } from './components/PlayhtLogo';

export const DEFAULT_VOICE = {
  voiceEngine: 'PlayHT1.0',
  id: 'larry',
  name: 'Larry',
  sampleUrl: 'https://peregrine-samples.s3.amazonaws.com/editor-samples/larry.wav',
  language: 'English (US)',
  languageCode: 'en-US',
  gender: 'male',
  ageGroup: 'adult',
  styles: ['narrative'],
  isCloned: false,
};

const App: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = useState<Voice>(DEFAULT_VOICE);

  return (
    <div className="container mx-auto p-4 flex flex-col items-center justify-center">
      <div className="min-w-full">
        <PlayhtLogo />
        <h1 className="text-3xl font-bold mb-4">PlayHT API Examples</h1>
        <ChooseVoice selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} />
        <hr className="my-4" />
        <CloneVoice setSelectedVoice={setSelectedVoice} />
        <hr className="my-4" />
        <SpeechGenerator selectedVoice={selectedVoice} />
        <hr className="my-4" />
        <SpeechStreamer selectedVoice={selectedVoice} />
      </div>
    </div>
  );
};

export default App;
