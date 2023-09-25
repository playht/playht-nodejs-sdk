import { CONFIG } from '../config';
import axios from 'axios';
import { Voice } from '../hooks/useVoices';

export const generateSpeech = async (text: string, voice: Voice) => {
  const response = await axios.post(CONFIG.BACKEND_HOST_URL + '/textToSpeech', {
    text,
    voiceId: voice.id,
    voiceEngine: voice.voiceEngine,
  });

  return response.data;
};

export const generateAudioStream = async (
  audioElementRef: React.RefObject<HTMLAudioElement>,
  reportError: (error: Error) => void,
  setIsGeneratingStream: (isGeneratingStream: boolean) => void,
  setAudioBlob: (audioBlob: Blob) => void,
  text: string,
  voice: Voice
) => {
  setIsGeneratingStream(true);
  setAudioBlob(new Blob());

  const allAudioChunks: Uint8Array[] = [];

  // clean up the audio element
  if (audioElementRef.current) {
    audioElementRef.current.src = '';
  }

  // check if the browser supports MediaSource and the source buffer type we need
  if (!MediaSource.isTypeSupported('audio/mpeg')) {
    reportError(new Error('MediaSource or source buffer type is not supported, please try a different browser'));
    return;
  }

  const mediaSource = new MediaSource();

  if (audioElementRef.current === null) return;

  audioElementRef.current.src = URL.createObjectURL(mediaSource);

  return mediaSource.addEventListener('sourceopen', function () {
    const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

    // Create an array to hold pending audio chunks.
    const audioChunksQueue: Uint8Array[] = [];

    // Function to process the audio queue
    const processAudioQueue = (sourceBuffer: SourceBuffer) => {
      if (audioChunksQueue.length === 0 || sourceBuffer.updating) {
        return;
      }

      const chunk = audioChunksQueue.shift();

      if (!chunk) {
        return;
      }

      try {
        sourceBuffer.appendBuffer(chunk);
      } catch (error) {
        console.error('Failed to append buffer:', error);
      } finally {
        if (audioChunksQueue.length > 0) {
          processAudioQueue(sourceBuffer);
        }
      }
    };

    sourceBuffer.addEventListener('updateend', function () {
      if (mediaSource.readyState === 'open') {
        if (audioChunksQueue.length > 0) {
          processAudioQueue(sourceBuffer);
        }

        try {
          mediaSource.endOfStream();
        } catch (error) {
          console.error('Failed to end the stream:', error);
        } finally {
          setIsGeneratingStream(false);
        }

        if (!audioElementRef.current) {
          reportError(new Error('Audio element is not defined'));
          return;
        }

        // Attempt to autoplay the audio
        audioElementRef.current.play().catch((error) => {
          console.error('Autoplay was prevented:', error);
        });
      }
    });

    // Fetch data here so that it's inside the 'sourceopen' event
    const fetchData = async () => {
      try {
        const response = await fetch(
          CONFIG.BACKEND_HOST_URL +
            '/streamSpeech' +
            `?text=${text}` +
            `&voiceId=${voice.id}` +
            `&voiceEngine=${voice.voiceEngine}`,
          {
            // method: 'POST',
            headers: {
              Accept: 'audio/mpeg',
              'Content-Type': 'application/json',
            },
            // body: JSON.stringify({
            //   text,
            // }),
          }
        );

        if (!response.ok) {
          console.error('Failed to fetch audio:', response);
          // the error has error_id and error_message in json format in the response body so we can parse it
          let error;

          try {
            error = await response.json();
            console.error('Error:', error);
          } catch (e) {
            console.error('Error:', error);
            error = { error_id: 'unknown', error_message: 'Unknown error' };
          }

          reportError(new Error(error.error_message));
          return;
        }

        if (!response.body) {
          reportError(new Error('Response body is empty'));
          return;
        }
        const reader = response.body.getReader();

        const processStream = async (): Promise<void> => {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            console.log('mediaSource.readyState', mediaSource.readyState);

            if (done) {
              if (mediaSource.readyState === 'open') {
                if (audioChunksQueue.length > 0) {
                  processAudioQueue(sourceBuffer);
                }

                try {
                  mediaSource.endOfStream();
                } catch (error) {
                  console.error('Failed to end the stream:', error);
                } finally {
                  setIsGeneratingStream(false);
                }
              }

              // Create a blob from the audio chunks
              const audioBlob = new Blob(allAudioChunks, {
                type: 'audio/mpeg',
              });
              setAudioBlob(audioBlob);

              return Promise.resolve();
            }

            allAudioChunks.push(value);
            audioChunksQueue.push(value);

            // Process the audio queue
            processAudioQueue(sourceBuffer);
          }
        };

        processStream();
      } catch (error) {
        setIsGeneratingStream(false);
        reportError(new Error('Failed to fetch audio: ' + error));
      }
    };

    return fetchData();
  });
};
