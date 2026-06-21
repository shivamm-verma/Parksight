## Setup

### Requirements
- Python 3.8+

### Navigate to the Model Directory

```bash
cd model
```

### Create and Activate a Virtual Environment (Recommended)

```bash
py 3.10 -m venv venv
```

Activate the virtual environment:

**Windows**
```bash
venv\Scripts\activate
```

**Linux/macOS**
```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

## Build & Run

### Start the FastAPI Server (Development)

```bash
uvicorn main:app --reload --port 8000
```

### Start the FastAPI Server (Production-like)

```bash
uvicorn main:app --port 8000
```