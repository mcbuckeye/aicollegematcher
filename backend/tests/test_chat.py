"""Tests for the chat endpoint."""
import os
from unittest.mock import patch, MagicMock


def test_chat_no_api_key(client):
    """Chat should return 503 when OpenAI key is not set."""
    with patch.dict(os.environ, {}, clear=False):
        with patch("app.routers.chat.OPENAI_API_KEY", None):
            response = client.post("/api/chat/message", json={
                "message": "What's a good engineering school?",
                "session_id": "test-session-123",
            })
            assert response.status_code == 503


def test_chat_message_limit_free_tier(client, db):
    """Free tier users should be limited to 3 messages."""
    from app.models import ChatMessage

    session_id = "test-limit-session"

    # Add 3 existing user messages
    for i in range(3):
        msg = ChatMessage(session_id=session_id, role="user", content=f"msg {i}")
        db.add(msg)
    db.commit()

    with patch("app.routers.chat.OPENAI_API_KEY", "fake-key"):
        response = client.post("/api/chat/message", json={
            "message": "One more message",
            "session_id": session_id,
        })
        assert response.status_code == 429
        data = response.json()
        assert "message_limit_reached" in str(data)


def test_chat_success(client, db):
    """Chat should succeed with valid API key and available messages."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "I recommend looking into MIT for engineering."

    with patch("app.routers.chat.OPENAI_API_KEY", "fake-key"):
        with patch("openai.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_client.chat.completions.create.return_value = mock_response
            mock_openai.return_value = mock_client

            response = client.post("/api/chat/message", json={
                "message": "What's a good engineering school?",
                "session_id": "test-success-session",
            })
            assert response.status_code == 200
            data = response.json()
            assert "reply" in data
            assert data["reply"] == "I recommend looking into MIT for engineering."
