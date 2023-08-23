import PlayHTAPI from "@playht/playht-nodejs-sdk";

async function ttsV2(req, res) {
  const apiKey = process.env.PLAYHT_API_KEY;
  const userId = process.env.PLAYHT_USER_ID;

  const text = req.body?.text || "The server could not find the text";

  const api = new PlayHTAPI(apiKey, userId);

  try {
    const generated = await api.genereateUltraRealisticSpeech(text, "larry");
    res.status(200).json(generated);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
}

export default ttsV2;
