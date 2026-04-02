# Software Project Concept Document
## Youth Program Impact Visualizer

A full-stack web application with a React frontend and Django backend.

## 🛠️ Tech Stack
- **Frontend:** React (in `clients/` folder)
- **Backend:** Django Python (in `apps/` folder)

---

## 🚀 How to Run This Project

### Prerequisites
- Node.js (v18+)
- Python (v3.12+)
- npm

---

### ▶️ Backend (Django)
```bash
cd apps
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

### ▶️ Frontend (React)

Open a new terminal:
```bash
cd clients
npm install
npm start
```

Visit `http://localhost:3000` in your browser.