# sql agent

Natural language interface to your SQL databases. Ask plain-English questions, get answers pulled from live database rows — no SQL required.

## Setup

1. Create a python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Set up environment variables in a `.env` file inside the backend directory.

4. Run the server:
   ```bash
   cd backend
   python app.py
   ```
