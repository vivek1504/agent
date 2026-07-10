import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from database_models import Base, User, SessionLocal
from app import app
from auth import get_current_user

TEST_DATABASE_URL = "sqlite:///:memory:"

from sqlalchemy.pool import StaticPool
engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    # Dependency override to use the test database
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    import app as main_app
    original_session_local = main_app.SessionLocal
    main_app.SessionLocal = lambda: db_session
    
    with TestClient(main_app.app) as c:
        yield c
        
    main_app.SessionLocal = original_session_local

@pytest.fixture(scope="function")
def test_user(db_session):
    user = User(github_id="12345", username="testuser", avatar_url="http://test.com/avatar.png")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_client(client, test_user):
    import app as main_app
    main_app.app.dependency_overrides[get_current_user] = lambda: test_user
    
    yield client
    
    main_app.app.dependency_overrides = {}
