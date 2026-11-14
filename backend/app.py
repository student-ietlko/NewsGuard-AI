
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import string

# Initialize Flask application
app = Flask(__name__)
CORS(app)

# Load your trained ML models and TF-IDF vectorizer
vectorization = joblib.load('vectorizer.pkl')
models = joblib.load('models.pkl')


# Text preprocessing function
def wordopt(text):
    text = text.lower()
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r"\W", " ", text)
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>+', '', text)
    text = re.sub(r'[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub(r'\n', '', text)
    text = re.sub(r'\w*\d\w*', '', text)
    return text


# Convert prediction into readable output
def output_label(n):
    if n == 0:
        return "Fake News"
    elif n == 1:
        return "True News"


# api route for home page 
@app.route('/')
def home():
    return "Fake News Detection Backend is Running!"
# API route for news prediction
@app.route('/predict', methods=['POST'])
def predict():

    data = request.get_json()

    if not data or not isinstance(data.get('text'), str) or not data['text'].strip():
        return jsonify({'error': 'Please enter a news article.'}), 400

    news = wordopt(data['text'])

    # Convert text into TF-IDF numerical features
    news_vector = vectorization.transform([news])

    # Get predictions from all four algorithms
    results = {}

    for name, model in models.items():
        prediction = model.predict(news_vector)[0]
        results[name] = output_label(prediction)

    return jsonify({
        'predictions': results
    })


# Run Flask server
if __name__ == '__main__':
    app.run(debug=True, port=5000)
