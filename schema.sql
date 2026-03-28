CREATE TABLE department (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_name TEXT NOT NULL,
    hod_name TEXT NOT NULL
);

CREATE TABLE venue (
    venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    block TEXT NOT NULL,
    floor INTEGER NOT NULL
);

CREATE TABLE event (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_type TEXT NOT NULL,
    reg_fee REAL NOT NULL DEFAULT 0,
    department_id INTEGER NOT NULL,
    venue_id INTEGER NOT NULL,
    FOREIGN KEY (department_id) REFERENCES department(department_id),
    FOREIGN KEY (venue_id) REFERENCES venue(venue_id)
);

CREATE TABLE student (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    year INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    FOREIGN KEY (department_id) REFERENCES department(department_id)
);

CREATE TABLE registration (
    registration_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reg_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    attendance TEXT NOT NULL DEFAULT 'Present',
    student_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES student(student_id),
    FOREIGN KEY (event_id) REFERENCES event(event_id),
    UNIQUE(student_id, event_id)
);

CREATE TABLE payment (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    mode TEXT NOT NULL DEFAULT 'Pending',
    pay_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (registration_id) REFERENCES registration(registration_id)
);

CREATE TABLE certificate (
    certificate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    cert_type TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    FOREIGN KEY (registration_id) REFERENCES registration(registration_id),
    UNIQUE(registration_id)
);
