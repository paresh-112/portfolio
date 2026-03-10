import requests
import json

BASE_URL = "http://localhost:8000/chat"
SESSION_ID = "test_session_123"

questions = [
    "Who is Paresh Prajapati?",
    "What are his core technical skills?",
    "Which projects has he worked on?",
    "Can you tell me more about the first project you mentioned?",
    "How can someone contact him?"
]

def test_chat():
    print(f"🚀 Starting API Test with Session ID: {SESSION_ID}\n")
    for i, q in enumerate(questions, 1):
        print(f"❓ Question {i}: {q}")
        payload = {
            "message": q,
            "session_id": SESSION_ID
        }
        try:
            response = requests.post(BASE_URL, json=payload, timeout=30)
            if response.status_code == 200:
                reply = response.json().get("reply", "No reply field")
                print(f"🤖 Answer: {reply}\n")
            else:
                print(f"❌ Error {response.status_code}: {response.text}\n")
        except Exception as e:
            print(f"💥 Request failed: {e}\n")

if __name__ == "__main__":
    test_chat()
