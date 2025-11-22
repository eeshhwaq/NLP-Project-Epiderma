import requests

url = "http://localhost:8000/analyze"

files = {
    "file": ("pic1.jpg", open("models/ml/pic1.jpg", "rb"), "image/jpeg")
}

response = requests.post(url, files=files)

print("Status:", response.status_code)
print("Response:")
print(response.json())
