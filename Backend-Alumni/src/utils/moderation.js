// src/utils/moderation.js
const { pipeline } = require("@xenova/transformers");
require("dotenv").config();

let moderationPipeline;

async function initModeration() {
  if (!moderationPipeline) {
    moderationPipeline = await pipeline("text-classification", "unitary/toxic-bert", {
      useAuthToken: process.env.HUGGINGFACE_TOKEN, // ضع توكن حسابك هنا
    });
    console.log("⚡️ Toxic-BERT moderation pipeline initialized!");
  }
  return moderationPipeline;
}

async function isContentBad(text) {
  if (!text) return false;

  try {
    const pipe = await initModeration();
    const results = await pipe(text);

    const flagged = results.some((r) =>
      ["toxic", "severe_toxic", "threat", "insult", "identity_hate"].includes(r.label)
    );

    return flagged;
  } catch (err) {
    console.error("Moderation AI error:", err);
    return false;
  }
}

module.exports = { isContentBad, initModeration };
