import * as PlayHT from 'playht';
import fs from 'node:fs';

export const allVoices = async () => {
  console.log('Listing all available voices');

  const allVoices = await PlayHT.listVoices();
  const formattedVoices = JSON.stringify(allVoices, null, 2);
  fs.writeFileSync('allVoices.JSON', formattedVoices);

  console.log('Information about all available voices have been saved to allVoices.JSON');
};
