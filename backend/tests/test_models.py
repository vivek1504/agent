from database_models import User, Playground
import uuid

def test_create_user(db_session):
    user = User(github_id="999", username="test_models_user", avatar_url="http://test.com/avatar.png")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    assert user.id is not None
    assert user.github_id == "999"
    assert user.username == "test_models_user"
    assert user.created_at is not None

def test_create_playground(db_session):
    user = User(github_id="888", username="pg_owner", avatar_url="http://test.com/avatar.png")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    pg = Playground(
        user_id=user.id, 
        name="Test Database", 
        db_url="postgresql://user:pass@localhost:5432/db",
        namespace=str(uuid.uuid4()),
        context="Sample context"
    )
    db_session.add(pg)
    db_session.commit()
    db_session.refresh(pg)
    
    assert pg.id is not None
    assert pg.name == "Test Database"
    assert pg.user_id == user.id
