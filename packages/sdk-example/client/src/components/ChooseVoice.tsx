import { useState, useEffect } from 'react';
import useVoices, { Voice } from '../hooks/useVoices';
import { Select } from './Select';

export const ChooseVoice = ({
  selectedVoice,
  setSelectedVoice,
}: {
  selectedVoice: Voice;
  setSelectedVoice: (voice: Voice) => void;
}) => {
  const { data: voices, loading: loadingVoices, error: errorLoadingVoices } = useVoices();
  const [updatedVoices, setUpdatedVoices] = useState<Voice[]>([]);

  useEffect(() => {
    if (selectedVoice && voices && !voices.some((v: Voice) => v.id === selectedVoice.id)) {
      setUpdatedVoices([...voices, selectedVoice]);
    } else {
      setUpdatedVoices(voices);
    }
  }, [selectedVoice, voices]);

  if (!updatedVoices) return null;

  return loadingVoices ? (
    <p>Loading voices...</p>
  ) : errorLoadingVoices ? (
    <p>Error loading voices</p>
  ) : (
    <Select
      label="Voice"
      id="voice"
      options={updatedVoices.map((v: Voice) => ({
        name: v.name + `- ${v.language}` + ` - (${v.voiceEngine})`,
        value: v.id,
      }))}
      value={selectedVoice.id}
      onChange={(id) => {
        const voice = updatedVoices.find((v: Voice) => v.id === id);
        if (voice) {
          setSelectedVoice(voice);
        }
      }}
    />
  );
};
