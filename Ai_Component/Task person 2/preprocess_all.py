import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import json

nltk.download('stopwords')

# قراءة البيانات
df = pd.read_csv("dataset (2).csv", sep=";", encoding="utf-8", on_bad_lines="skip", engine='python')
print("Columns in CSV:", df.columns)

text_col = 'text'

# إزالة الصفوف الفارغة والتكرارات
df = df.dropna(subset=[text_col])
df = df.drop_duplicates(subset=[text_col])

# Arabic normalization
def normalize_arabic(word):
    word = re.sub("[إأآا]", "ا", word)
    word = re.sub("ى", "ي", word)
    word = re.sub("ؤ", "و", word)
    word = re.sub("ئ", "ي", word)
    word = re.sub("ة", "ه", word)
    return word

# تنظيف النصوص لكل كلمة حسب اللغة (ar / en / mix)
def clean_text_mixed(text):
    text = str(text).strip()
    words = text.split()
    cleaned_words = []
    for w in words:
        # كلمة فيها حرف عربي
        if re.search(r"[ء-ي]", w):
            w = normalize_arabic(w)
        else:
            w = w.lower()
        # إزالة الرموز الغريبة
        w = re.sub(r"[^a-zA-Z0-9ء-ي]", "", w)
        if w:
            cleaned_words.append(w)
    return " ".join(cleaned_words)

df["cleaned_text"] = df[text_col].apply(clean_text_mixed)

# إزالة stopwords
stop_ar = set(stopwords.words("arabic"))
stop_en = set(stopwords.words("english"))
stop_all = stop_ar.union(stop_en)

df["cleaned_text"] = df["cleaned_text"].apply(lambda t: " ".join([w for w in t.split() if w not in stop_all]))

# إنشاء نسخة tokenized لكل نص
df["tokens"] = df["cleaned_text"].str.split()

# استبعاد أي نصوص أصبحت فارغة بعد التنظيف
df = df[df["cleaned_text"].str.strip() != ""]

# تقسيم البيانات إلى تدريب واختبار
train, val = train_test_split(df, test_size=0.2, random_state=42)

# حفظ النسخ النظيفة والتقسيمات
df.to_csv("cleaned_dataset.csv", sep=";", index=False, encoding="utf-8")
df.to_json("cleaned_dataset.json", orient="records", force_ascii=False)
train.to_csv("train_split.csv", sep=";", index=False, encoding="utf-8")
val.to_csv("val_split.csv", sep=";", index=False, encoding="utf-8")

# تجهيز TF-IDF vectors
vectorizer = TfidfVectorizer(max_features=12000)
X = vectorizer.fit_transform(df["cleaned_text"])
y = df["label"]

# حفظ TF-IDF vectorizer
joblib.dump(vectorizer, "tfidf_vectorizer.joblib")

# حفظ features و labels
joblib.dump({"X": X, "y": y}, "dataset_features.joblib")

# حفظ النسخة tokenized منفصلة لو تحب
df[["tokens", "label"]].to_pickle("dataset_tokens.pkl")

# تقرير عن المعالجة
report = {
    "total_rows": len(df),
    "training_rows": len(train),
    "validation_rows": len(val),
    "features": X.shape[1],
    "vectorizer_file": "tfidf_vectorizer.joblib"
}

with open("report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, indent=4, ensure_ascii=False)

print("Preprocessing for Arabic, English, and Mix texts done successfully.")
