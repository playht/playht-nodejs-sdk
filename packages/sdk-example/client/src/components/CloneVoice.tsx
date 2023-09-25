import React, { useState, useRef } from 'react';
import { VoiceData, uploadAndCloneVoice } from '../API/cloning.requests';
import { Voice } from '../hooks/useVoices';

interface CloneVoiceProps {
  setSelectedVoice: React.Dispatch<React.SetStateAction<Voice>>;
}

export const CloneVoice: React.FC<CloneVoiceProps> = ({ setSelectedVoice }) => {
  const [voiceName, setVoiceName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsloading] = useState(false);

  const uploadFile = async () => {
    setErrorMessage(null);
    const file = fileInputRef.current?.files?.[0];

    if (!file || !voiceName) {
      setErrorMessage('Please fill in all fields before uploading.');
      return;
    }

    setIsloading(true);
    try {
      const data: VoiceData = await uploadAndCloneVoice(file, voiceName);

      if (!data.id) {
        throw new Error('No voice ID returned.');
      }

      setSelectedVoice({
        ...data,
        sampleUrl: '',
        language: '',
        languageCode: '',
        gender: '',
        ageGroup: '',
      });

      setVoiceName('');
      alert(`Cloned voice ${voiceName} created successfully!`);
    } catch (error) {
      setErrorMessage(`Error uploading file: ${error}`);
    } finally {
      setIsloading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Clone a voice</h2>
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {errorMessage}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex">
          <input
            type="text"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="w-fit bg-inherit resize-none border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter voice name"
          />
          <input type="file" ref={fileInputRef} className="p-2 rounded" />
        </div>
        <button
          onClick={uploadFile}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-fit"
          disabled={isLoading}
        >
          Clone Voice
        </button>
      </div>
    </div>
  );
};
