const PLAY_DIALOG_TURBO_VOICES_MAP: { [key: string]: string } = {
  // English voices
  's3://voice-cloning-zero-shot/42c41808-0ddb-4674-8965-024a52ad6c8e/original/manifest.json': 'Arista-PlayAI',
  's3://voice-cloning-zero-shot/d9ff78ba-d716-47fc-915d-xxxxxxxxxxxx/original/manifest.json': 'Atlas-PlayAI',
  's3://voice-cloning-zero-shot/0f99b8e3-1c9f-44b4-a3a9-xxxxxxxxxxxx/original/manifest.json': 'Basil-PlayAI',
  's3://voice-cloning-zero-shot/e4e2f3c5-a84e-4e5a-9b69-xxxxxxxxxxxx/original/manifest.json': 'Briggs-PlayAI',
  's3://voice-cloning-zero-shot/7c3f3a7e-2683-46d7-9595-xxxxxxxxxxxx/original/manifest.json': 'Calum-PlayAI',
  's3://voice-cloning-zero-shot/b3c83e1f-3bec-4f23-a48b-xxxxxxxxxxxx/original/manifest.json': 'Celeste-PlayAI',
  's3://voice-cloning-zero-shot/f1c8adec-2e0d-4b3f-9b36-xxxxxxxxxxxx/original/manifest.json': 'Cheyenne-PlayAI',
  's3://voice-cloning-zero-shot/85d67d83-32c5-4a28-a165-065f655efef0/original/manifest.json': 'Chip-PlayAI',
  's3://voice-cloning-zero-shot/d5e7c1f8-a6b2-4c3d-9e8f-xxxxxxxxxxxx/original/manifest.json': 'Cillian-PlayAI',
  's3://voice-cloning-zero-shot/e7f6c8d9-a5b4-4c3d-2e1f-xxxxxxxxxxxx/original/manifest.json': 'Deedee-PlayAI',
  's3://voice-cloning-zero-shot/f8e7d6c5-b4a3-2c1d-9e8f-xxxxxxxxxxxx/original/manifest.json': 'Fritz-PlayAI',
  's3://voice-cloning-zero-shot/c5d4e3f2-a1b2-3c4d-5e6f-xxxxxxxxxxxx/original/manifest.json': 'Gail-PlayAI',
  's3://voice-cloning-zero-shot/d1e2f3a4-b5c6-7d8e-9f0a-xxxxxxxxxxxx/original/manifest.json': 'Indigo-PlayAI',
  's3://voice-cloning-zero-shot/a1b2c3d4-e5f6-7a8b-9c0d-xxxxxxxxxxxx/original/manifest.json': 'Mamaw-PlayAI',
  's3://voice-cloning-zero-shot/b2c3d4e5-f6a7-8b9c-0d1e-xxxxxxxxxxxx/original/manifest.json': 'Mason-PlayAI',
  's3://voice-cloning-zero-shot/c3d4e5f6-a7b8-9c0d-1e2f-xxxxxxxxxxxx/original/manifest.json': 'Mikail-PlayAI',
  's3://voice-cloning-zero-shot/d4e5f6a7-b8c9-0d1e-2f3a-xxxxxxxxxxxx/original/manifest.json': 'Mitch-PlayAI',
  's3://voice-cloning-zero-shot/e5f6a7b8-c9d0-1e2f-3a4b-xxxxxxxxxxxx/original/manifest.json': 'Quinn-PlayAI',
  's3://voice-cloning-zero-shot/f6a7b8c9-d0e1-2f3a-4b5c-xxxxxxxxxxxx/original/manifest.json': 'Thunder-PlayAI',
  // Arabic voices
  's3://voice-cloning-zero-shot/a7b8c9d0-e1f2-3a4b-5c6d-xxxxxxxxxxxx/original/manifest.json': 'Nasser-PlayAI',
  's3://voice-cloning-zero-shot/b8c9d0e1-f2a3-4b5c-6d7e-xxxxxxxxxxxx/original/manifest.json': 'Khalid-PlayAI',
  's3://voice-cloning-zero-shot/c9d0e1f2-a3b4-5c6d-7e8f-xxxxxxxxxxxx/original/manifest.json': 'Amira-PlayAI',
  's3://voice-cloning-zero-shot/d0e1f2a3-b4c5-6d7e-8f9a-xxxxxxxxxxxx/original/manifest.json': 'Ahmad-PlayAI',
};

export function isPlayDialogTurboVoice(voiceId: string): boolean {
  return PLAY_DIALOG_TURBO_VOICES_MAP[voiceId] !== undefined;
}

export function mapPlayDialogTurboVoice(voiceId: string) {
  return PLAY_DIALOG_TURBO_VOICES_MAP[voiceId] ?? voiceId;
}
