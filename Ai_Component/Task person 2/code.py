import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle

# read file
df = pd.read_csv("dataset_ready.csv", sep=";", encoding="utf-8")

# basic strip
df["text"] = df["text"].astype(str).str.strip()

# english lowercase
df.loc[df["language"] == "en", "text"] = df["text"].str.lower()

# arabic normalization
def normalize_arabic(text):
    text = re.sub("[إأآا]", "ا", text)
    text = re.sub("ى", "ي", text)
    text = re.sub("ؤ", "و", text)
    text = re.sub("ئ", "ي", text)
    text = re.sub("ة", "ه", text)
    return text

df.loc[df["language"] == "ar", "text"] = df["text"].apply(normalize_arabic)

# remove symbols
df["text"] = df["text"].apply(lambda x: re.sub(r"[^a-zA-Z0-9\u0600-\u06FF\s]", "", x))

# remove extra spaces
df["text"] = df["text"].str.replace(r"\s+", " ", regex=True).str.strip()

# tokenization simple
df["tokens"] = df["text"].str.split()

# استبعاد أي صفوف أصبح النص فيها فارغ بعد التنظيف
df = df[df["text"].str.strip() != ""]

# save cleaned dataset
df.to_csv("dataset_clean_ai.csv", sep=";", index=False, encoding="utf-8")

# تجهيز TF-IDF vectors على النصوص النظيفة
vectorizer = TfidfVectorizer(max_features=5000)
X = vectorizer.fit_transform(df["text"])
y = df["label"]

# حفظ TF-IDF vectorizer
with open("tfidf_vectorizer_ai.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

# حفظ features و labels
with open("dataset_features_ai.pkl", "wb") as f:
    pickle.dump({"X": X, "y": y}, f)

print("Clean dataset and features saved successfully with new names.")
