// src/utils/moderation.js
const Filter = require("bad-words"); // commonjs import

/**
 * ترجع true لو المحتوى سيء، false لو تمام
 */
function isContentBad(text) {
  if (!text) return false;

  try {
    const filter = new Filter();
    return filter.isProfane(text); // true لو المحتوى فيه كلمات سيئة
  } catch (err) {
    console.error("Local moderation error:", err);
    // لو فيه مشكلة نعتبر المحتوى آمن
    return false;
  }
}

module.exports = { isContentBad };
