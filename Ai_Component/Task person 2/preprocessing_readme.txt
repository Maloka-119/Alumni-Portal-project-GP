# Preprocessing and AI Policy - Overview

All preprocessing tasks for AI content filtering are completed. The following files are ready for model training:

1. dataset_clean_ai.csv
   - Cleaned and normalized dataset.
   - Columns: text, label, language, tokens.
   - Empty or problematic rows removed.
   - Ready to be used for training.

2. tfidf_vectorizer_ai.pkl
   - TF-IDF vectorizer trained on the cleaned dataset.
   - Can be reused to transform new text consistently.

3. dataset_features_ai.pkl
   - Contains X (TF-IDF features) and y (labels) ready for training.

4. ai_policy.doc
   - Updated AI content filtering policy.
   - Defines categories: clean, toxic, risky.
   - Classification rules and output format.

## Next Steps
- Use `dataset_features_ai.pkl` to train the AI model.
- Optionally, use `tfidf_vectorizer_ai.pkl` to transform new input text.
- Ensure model predictions follow the rules in `ai_policy.txt`.

Prepared by: [Konoz Mostafa]
