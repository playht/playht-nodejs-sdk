const PLAY_DIALOG_TURBO_VOICES_MAP: { [key: string]: string } = {
  // English voices
  's3://voice-cloning-zero-shot/42c41808-0ddb-4674-8965-024a52ad6c8e/original/manifest.json': 'Arista-PlayAI',
  's3://voice-cloning-zero-shot/e46b4027-b38d-4d24-b292-38fbca2be0ef/original/manifest.json': 'Atlas-PlayAI',
  's3://voice-cloning-zero-shot/Basil___-____-____-____-____________/original/manifest.json': 'Basil-PlayAI',
  's3://voice-cloning-zero-shot/71cdb799-1e03-41c6-8a05-f7cd55134b0b/original/manifest.json': 'Briggs-PlayAI',
  's3://voice-cloning-zero-shot/81aa8eb4-56dc-4104-96ad-65484be686e6/original/manifest.json': 'Calum-PlayAI',
  's3://voice-cloning-zero-shot/24507c14-c743-4943-80db-a1e16248309a/original/manifest.json': 'Celeste-PlayAI',
  's3://voice-cloning-zero-shot/ae86f8a3-76bf-4ded-a5fd-bea9d1c8ea1a/original/manifest.json': 'Cheyenne-PlayAI',
  's3://voice-cloning-zero-shot/85d67d83-32c5-4a28-a165-065f655efef0/original/manifest.json': 'Chip-PlayAI',
  's3://voice-cloning-zero-shot/1591b954-8760-41a9-bc58-9176a68c5726/original/manifest.json': 'Cillian-PlayAI',
  's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json': 'Deedee-PlayAI',
  's3://voice-cloning-zero-shot/373e9621-167b-4efb-8c62-3167fe5b521d/original/manifest.json': 'Fritz-PlayAI',
  's3://voice-cloning-zero-shot/a61e48b1-e0ec-48a7-9ab1-5b96a758c401/original/manifest.json': 'Gail-PlayAI',
  's3://voice-cloning-zero-shot/97580643-b568-4198-aaa4-3e07e4a06c47/original/manifest.json': 'Indigo-PlayAI',
  's3://voice-cloning-zero-shot/580181a2-55ec-44fa-baf3-944acb1649df/original/manifest.json': 'Mamaw-PlayAI',
  's3://voice-cloning-zero-shot/a540a448-a9ca-446c-9538-d1bae6c506f1/original/manifest.json': 'Mason-PlayAI',
  's3://voice-cloning-zero-shot/98d00a64-a4e6-4096-b494-7270eb50a905/original/manifest.json': 'Mikail-PlayAI',
  's3://voice-cloning-zero-shot/c14e50f2-c5e3-47d1-8c45-fa4b67803d19/original/manifest.json': 'Mitch-PlayAI',
  's3://voice-cloning-zero-shot/e53b50b7-142b-4d66-922f-1d6410832489/original/manifest.json': 'Quinn-PlayAI',
  's3://voice-cloning-zero-shot/Thunder_-____-____-____-____________/original/manifest.json': 'Thunder-PlayAI',
  // New English voices
  's3://voice-cloning-zero-shot/f6c4ed76-1b55-4cd9-8896-31f7535f6cdb/original/manifest.json': 'Aaliyah-PlayAI',
  's3://voice-cloning-zero-shot/f9bf96ae-19ef-491f-ae69-644448800566/original/manifest.json': 'Adelaide-PlayAI',
  's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json': 'Angelo-PlayAI',
  's3://voice-cloning-zero-shot/d712cad5-85db-44c6-8ee0-8f4361ed537b/eleanorsaad2/manifest.json': 'Eleanor-PlayAI',
  's3://voice-cloning-zero-shot/801a663f-efd0-4254-98d0-5c175514c3e8/jennifer/manifest.json': 'Jennifer-PlayAI',
  's3://voice-cloning-zero-shot/ZkeJxqcjXvUGsYGR8_uy1/tiffany-voice-of-play-ai/manifest.json': 'Judy-PlayAI',
  's3://voice-cloning-zero-shot/831bd330-85c6-4333-b2b4-10c476ea3491/original/manifest.json': 'Nia-PlayAI',
  's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json': 'Ruby-PlayAI',
  // Arabic voices
  's3://voice-cloning-zero-shot/Nasser__-____-____-____-____________/original/manifest.json': 'Nasser-PlayAI',
  's3://voice-cloning-zero-shot/61FkRDykpefFibpqCMEHl/khalid-arabic/manifest.json': 'Khalid-PlayAI',
  's3://voice-cloning-zero-shot/mzC-mRcDq38LCRzodkM-Z/amira-arabic/manifest.json': 'Amira-PlayAI',
  's3://voice-cloning-zero-shot/uLCIZjJAz3iMqA5cK4ObF/ahmad-arabic/manifest.json': 'Ahmad-PlayAI',
};

export function isPlayDialogTurboVoice(voiceId: string): boolean {
  return PLAY_DIALOG_TURBO_VOICES_MAP[voiceId] !== undefined || voiceId?.endsWith('-PlayAI');
}

export function mapPlayDialogTurboVoice(voiceId: string) {
  return PLAY_DIALOG_TURBO_VOICES_MAP[voiceId] ?? voiceId;
}
