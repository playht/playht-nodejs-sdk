const PLAY_DIALOG_TURBO_VOICES_MAP: { [key: string]: string } = {
  's3://voice-cloning-zero-shot/42c41808-0ddb-4674-8965-024a52ad6c8e/original/manifest.json': 'Arista-PlayAI',
};

export function isPlayDialogTurboVoice(voiceId: string): boolean {
  return PLAY_DIALOG_TURBO_VOICES_MAP[voiceId] !== undefined;
}

export function mapPlayDialogTurboVoice(voiceId: string) {
  return PLAY_DIALOG_TURBO_VOICES_MAP[voiceId] ?? voiceId;
}
