import { getAll } from '../API/voices.requests';
import { useQuery } from 'react-query';

export const VOICES_QUERY_KEY = 'voices';

export interface Voice {
  voiceEngine: string;
  id: string;
  name: string;
  sampleUrl: string;
  language: string;
  languageCode: string;
  gender: string;
  ageGroup: string;
  isCloned: boolean;
}

export function useVoices() {
  const { data, isLoading, isFetching, error, refetch, isFetchedAfterMount } = useQuery({
    queryKey: [VOICES_QUERY_KEY],
    queryFn: async () => await getAll(),
  });

  return {
    data,
    error,
    loading: (isLoading || isFetching) && !isFetchedAfterMount,
    refetch,
  };
}

export default useVoices;
