Preprocessing & Feature Engineering — AI Project

Overview
This preprocessing pipeline prepares the dataset for AI model training.
It covers text cleaning, normalization, tokenization, stopwords removal, feature engineering, and train/validation split.
It now supports Arabic (ar), English (en), and mixed Franco-Arabic/English (mix) texts.

Input
- dataset (2).csv — original dataset with columns:
  - text — the content
  - language — ar for Arabic, en for English, mix for mixed texts
  - label — target label

Preprocessing Steps
1. Remove duplicates and empty rows
2. Text normalization:
   - Lowercase for English
   - Arabic normalization for Arabic words (إأآا → ا, ى → ي, ؤ → و, ئ → ي, ة → ه)
   - For mix texts: apply Arabic normalization on Arabic words and lowercase for English words
3. Remove unwanted characters and symbols
4. Remove extra whitespace
5. Stopwords removal — Arabic & English
6. Tokenization — splits cleaned text into words
7. Filter empty texts after cleaning

Feature Engineering
- Convert cleaned text to TF-IDF vectors (max_features=12000)
- Save TF-IDF vectorizer for future use (tfidf_vectorizer.joblib)
- Save X (features) and y (labels) (dataset_features.joblib)

Train/Validation Split
- Split dataset into 80% training and 20% validation
- Save CSVs:
  - train_split.csv
  - val_split.csv

Output Files

File | Description
------|-------------
cleaned_dataset.csv | Cleaned dataset with cleaned_text column
cleaned_dataset.json | JSON version of cleaned dataset
train_split.csv | Training set (80%)
val_split.csv | Validation set (20%)
tfidf_vectorizer.joblib | TF-IDF vectorizer for transforming text
dataset_features.joblib | Features (X) and labels (y) for model training
dataset_tokens.pkl | Tokenized version of cleaned text with labels
report.json | Summary report: total rows, train/val size, number of features

Notes
- Any text that becomes empty after cleaning or stopwords removal is removed.
- Arabic normalization reduces loss due to different character variants.
- Mixed texts (mix) are normalized per word, preserving both Arabic and English content.
- Tokenized version (dataset_tokens.pkl) can be used directly for NLP models that require word-level input.
