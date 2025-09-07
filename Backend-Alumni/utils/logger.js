const logger = (message, type = "info") => {
  const timestamp = new Date().toISOString();
  console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`);
};

module.exports = logger;
