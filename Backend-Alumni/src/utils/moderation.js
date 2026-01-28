const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * ترجع true لو المحتوى سيء، false لو تمام
 */
async function isContentBad(text) {
  if (!text) return false;

  try {
    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.results[0]; 

console.log("Moderation result:", result);
return result.flagged;

    return result.flagged;
  } catch (err) {
    console.error("Moderation API error:", err);
    return false;
  }
}

module.exports = { isContentBad };
