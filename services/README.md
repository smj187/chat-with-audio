python -m venv venv
.\venv\Scripts\Activate.ps1

pip freeze > requirements.txt
pip install -r ./requirements.txt

uvicorn main:app --host localhost --port 8080 --reload
