const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, 
});

const openai = new OpenAIApi(configuration);


async function isContentBad(text) {
  if (!text) return false;

  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.data.results[0];
    return result.flagged; 
  } catch (err) {
    console.error("Moderation API error:", err);
   
    return false;
  }
}

module.exports = { isContentBad };
