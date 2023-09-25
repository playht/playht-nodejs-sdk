import useVoices, { Voice } from '../hooks/useVoices';
import { Select } from './Select';
import { Spinner } from './Spinner';

export const ChooseVoice = ({
  selectedVoice,
  setSelectedVoice,
}: {
  selectedVoice: Voice;
  setSelectedVoice: (voice: Voice) => void;
}) => {
  const { data: voices, loading: loadingVoices, error: errorLoadingVoices } = useVoices();

  return loadingVoices ? (
    <div className="inline-flex h-full w-full items-center justify-center">
      <Spinner />
      <span className="bold">Loading voices...</span>
    </div>
  ) : errorLoadingVoices ? (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      Error loading voices
    </div>
  ) : (
    <>
      <h2 className="text-2xl font-semibold">Choose a voice</h2>
      <Select
        label="Voice"
        id="voice"
        options={voices.map((v: Voice) => ({
          name: `${v.name} ${v.language ? `- ${v.language}` : ''} - (${v.voiceEngine})`,
          value: v.id,
        }))}
        value={selectedVoice.id}
        onChange={(id) => {
          const voice = voices.find((v: Voice) => v.id === id);
          if (voice) {
            setSelectedVoice(voice);
          }
        }}
      />
    </>
  );
};
