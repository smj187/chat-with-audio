py -3.10 -m venv venv
.\venv\Scripts\Activate.ps1

uvicorn main:app --host localhost --port 8080 --reload

PROCESS FLOW:

STEP 1 - get transcription from deepgram
STEP 2 -
