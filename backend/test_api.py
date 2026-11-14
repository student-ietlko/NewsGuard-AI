
import requests

url = "http://127.0.0.1:5000/predict"

news = """
The government has announced a new policy
to improve education facilities across the country.
"""

response = requests.post(url, json={"text": news})

print("Status Code:", response.status_code)
print("Predictions:", response.json())
