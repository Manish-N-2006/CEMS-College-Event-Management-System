# 🎓 CEMS – College Event Management System

A full-stack web application to manage college events, students, registrations, payments, and certificates efficiently.

---

## 🚀 Features

- 📊 Dashboard with real-time statistics  
- 🏢 Department & Venue Management  
- 👨‍🎓 Student Management System  
- 📅 Event Creation & Tracking  
- 📋 Event Registration System  
- 💳 Automatic Payment Generation  
- 🏆 Certificate Issuance (only for Present students)  
- 🔐 Role-based Authentication (Admin / Staff)  

---

## 🛠️ Tech Stack

- **Backend:** Python (Flask)  
- **Database:** SQLite  
- **ORM:** SQLAlchemy  
- **Frontend:** HTML, CSS, JavaScript  

---

## 📂 Project Structure

```bash
CEMS/
├── app.py
├── requirements.txt
├── database.db
│
├── templates/
│   ├── login.html
│   └── index.html
│
├── static/
│   ├── app.js
│   └── style.css
│
└── README.md
```


---

## ⚙️ Installation & Setup

1. Clone the repository:
```
git clone https://github.com/your-username/cems-event-management-system.git
cd cems-event-management-system
```

2. Install dependencies:
```
pip install -r requirements.txt
```

3. Run the application:
```
python app.py
```

4. Open in browser:
```
http://127.0.0.1:5000
```

## 🔐 Demo Credentials
Role	Username	Password
Admin	admin	admin123
Staff	staff	staff123

---
## 🗄️ Database Design

The system uses a relational database (SQLite) with the following tables:

Department
Venue
Event
Student
Registration
Payment
Certificate

## 🔗 Relationships
One Department → Many Events
One Event → Many Registrations
One Student → Many Registrations
One Registration → One Payment
One Registration → One Certificate

---

👨‍💻 Author
Manish N
