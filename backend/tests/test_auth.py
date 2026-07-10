
from auth import make_token
from jose import jwt
import auth

def test_make_token():
    token = make_token(123)
    assert token is not None
    assert type(token) == str
    
    decoded = jwt.decode(token, auth.SECRET, algorithms=["HS256"])
    assert decoded["sub"] == "123"
