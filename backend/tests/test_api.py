import pytest
from unittest.mock import MagicMock
from database_models import Playground
import uuid

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_auth_login(client):
    response = client.get("/auth/login", follow_redirects=False)
    # The endpoint redirects to GitHub oauth authorize page
    assert response.status_code == 307
    assert "github.com/login/oauth/authorize" in response.headers["location"]

def test_me(auth_client, test_user):
    response = auth_client.get("/me")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["username"] == test_user.username

def test_me_unauthorized(client):
    response = client.get("/me")
    # Depends(get_current_user) raises HTTP 401 on missing/invalid token
    assert response.status_code == 401

def test_create_playground(auth_client, mocker):
    # Mock load_database to avoid actual DB connection checks during tests
    mock_load = mocker.patch("SQLAgent.load_database")
    mock_db = MagicMock()
    mock_load.return_value = mock_db
    
    response = auth_client.post("/playground/new", json={
        "name": "Test Playground",
        "db_url": "sqlite:///:memory:",
        "context": "Context description"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "Test Playground"
    assert "namespace" in data

def test_list_playgrounds(auth_client, test_user, db_session):
    pg = Playground(user_id=test_user.id, name="My PG", db_url="sqlite://", namespace=str(uuid.uuid4()))
    db_session.add(pg)
    db_session.commit()
    
    response = auth_client.get("/playground/list")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "My PG"

def test_get_playground(auth_client, test_user, db_session):
    pg = Playground(user_id=test_user.id, name="Fetch Me", db_url="sqlite://", namespace=str(uuid.uuid4()), context="test")
    db_session.add(pg)
    db_session.commit()
    
    response = auth_client.get(f"/playground/{pg.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Fetch Me"

def test_delete_playground(auth_client, mocker, test_user, db_session):
    pg = Playground(user_id=test_user.id, name="Delete Me", db_url="sqlite://", namespace=str(uuid.uuid4()))
    db_session.add(pg)
    db_session.commit()
    
    mock_delete_namespace = mocker.patch("vectordb.delete_namespace")
    
    response = auth_client.delete(f"/playground/{pg.id}")
    assert response.status_code == 200
    assert response.json() == {"deleted": True}
    
    assert mock_delete_namespace.called
    
    # Verify it's gone
    assert db_session.query(Playground).filter_by(id=pg.id).first() is None

def test_ingest(auth_client, mocker, test_user, db_session):
    pg = Playground(user_id=test_user.id, name="Ingest PG", db_url="sqlite://", namespace=str(uuid.uuid4()))
    db_session.add(pg)
    db_session.commit()
    
    # Mock vectordb insertion
    mock_upsert = mocker.patch("vectordb.upsert_documents")
    
    # Send mock file
    files = {'files': ('test.txt', b'this is text data', 'text/plain')}
    data = {'playground_id': str(pg.id), 'context': 'Updated context'}
    
    response = auth_client.post("/ingest", data=data, files=files)
    
    assert response.status_code == 200
    assert response.json()["ingested"] == 1
    assert mock_upsert.called

def test_ask(auth_client, mocker, test_user, db_session):
    # Set app state to bypass model loading check
    import app as main_app
    main_app.app.state.models_ready = True
    main_app.app.state.model = MagicMock()
    
    pg = Playground(user_id=test_user.id, name="Ask PG", db_url="sqlite://", namespace=str(uuid.uuid4()))
    db_session.add(pg)
    db_session.commit()
    
    # Mock the heavy parts
    mocker.patch("SQLAgent.load_database")
    mocker.patch("vectordb.retrieve_context", return_value="mock context doc")
    mocker.patch("SQLAgent.create_agent", return_value="mock_agent_instance")
    mocker.patch("SQLAgent.ask_question", return_value="There are 5 tables.")
    
    response = auth_client.post("/ask", json={
        "question": "How many tables?",
        "playground_id": pg.id
    })
    
    assert response.status_code == 200
    assert response.json()["answer"] == "There are 5 tables."
    assert response.json()["playground"] == "Ask PG"
