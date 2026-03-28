from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import date
import os

app = Flask(__name__)
app.secret_key = "cems_secret_key_2024"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(BASE_DIR, "database.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class Department(db.Model):
    __tablename__ = "department"
    department_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dept_name     = db.Column(db.String(100), nullable=False)
    hod_name      = db.Column(db.String(100), nullable=False)
    events        = db.relationship("Event", backref="department", lazy=True)

    def to_dict(self):
        return {
            "id":   self.department_id,
            "name": self.dept_name,
            "hod":  self.hod_name
        }


class Venue(db.Model):
    __tablename__ = "venue"
    venue_id   = db.Column(db.Integer, primary_key=True, autoincrement=True)
    venue_name = db.Column(db.String(100), nullable=False)
    capacity   = db.Column(db.Integer, nullable=False)
    block      = db.Column(db.String(50), nullable=False)
    floor      = db.Column(db.Integer, nullable=False)
    events     = db.relationship("Event", backref="venue", lazy=True)

    def to_dict(self):
        return {
            "id":       self.venue_id,
            "name":      self.venue_name,
            "capacity": self.capacity,
            "block":    self.block,
            "floor":    self.floor
        }


class Event(db.Model):
    __tablename__ = "event"
    event_id     = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_name   = db.Column(db.String(100), nullable=False)
    event_date   = db.Column(db.String(20),  nullable=False)
    event_type   = db.Column(db.String(50),  nullable=False)
    reg_fee      = db.Column(db.Float,       nullable=False, default=0)
    department_id= db.Column(db.Integer, db.ForeignKey("department.department_id"), nullable=False)
    venue_id     = db.Column(db.Integer, db.ForeignKey("venue.venue_id"),           nullable=False)
    registrations= db.relationship("Registration", backref="event", lazy=True)

    def to_dict(self):
        return {
            "id":      self.event_id,
            "name":    self.event_name,
            "date":    self.event_date,
            "type":    self.event_type,
            "fee":     self.reg_fee,
            "deptId":  self.department_id,
            "venueId": self.venue_id,
            "deptName":  self.department.dept_name  if self.department else "-",
            "venueName": self.venue.venue_name       if self.venue      else "-"
        }


class Student(db.Model):
    __tablename__ = "student"
    student_id    = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(100), nullable=False, unique=True)
    phone         = db.Column(db.String(15),  nullable=False)
    year          = db.Column(db.Integer,     nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("department.department_id"), nullable=False)
    registrations = db.relationship("Registration", backref="student", lazy=True)

    def to_dict(self):
        dept = Department.query.get(self.department_id)
        return {
            "id":       self.student_id,
            "name":     self.name,
            "email":    self.email,
            "phone":    self.phone,
            "year":     self.year,
            "deptId":   self.department_id,
            "deptName": dept.dept_name if dept else "-"
        }


class Registration(db.Model):
    __tablename__ = "registration"
    registration_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    reg_date        = db.Column(db.String(20), nullable=False)
    status          = db.Column(db.String(50), nullable=False, default="Confirmed")
    attendance      = db.Column(db.String(20), nullable=False, default="Present")
    student_id      = db.Column(db.Integer, db.ForeignKey("student.student_id"), nullable=False)
    event_id        = db.Column(db.Integer, db.ForeignKey("event.event_id"),     nullable=False)
    payment         = db.relationship("Payment",     backref="registration", uselist=False, lazy=True)
    certificate     = db.relationship("Certificate", backref="registration", uselist=False, lazy=True)

    def to_dict(self):
        pay = self.payment
        return {
            "id":          self.registration_id,
            "studentId":  self.student_id,
            "eventId":    self.event_id,
            "date":        self.reg_date,
            "status":      self.status,
            "attendance": self.attendance,
            "studentName":self.student.name       if self.student else "-",
            "eventName":  self.event.event_name   if self.event   else "-",
            "payStatus":  pay.status              if pay          else "No Record"
        }


class Payment(db.Model):
    __tablename__ = "payment"
    payment_id      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registration.registration_id"), nullable=False)
    amount          = db.Column(db.Float,      nullable=False)
    mode            = db.Column(db.String(50), nullable=False, default="Pending")
    pay_date        = db.Column(db.String(20), nullable=False)
    status          = db.Column(db.String(50), nullable=False, default="Pending")

    def to_dict(self):
        reg = self.registration
        return {
            "id":           self.payment_id,
            "regId":       self.registration_id,
            "amount":      self.amount,
            "mode":         self.mode,
            "date":         self.pay_date,
            "status":       self.status,
            "studentName": reg.student.name     if reg and reg.student else "-",
            "eventName":   reg.event.event_name if reg and reg.event   else "-"
        }


class Certificate(db.Model):
    __tablename__ = "certificate"
    certificate_id  = db.Column(db.Integer, primary_key=True, autoincrement=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registration.registration_id"), nullable=False)
    cert_type       = db.Column(db.String(50), nullable=False)
    issue_date      = db.Column(db.String(20), nullable=False)

    def to_dict(self):
        reg = self.registration
        return {
            "id":           self.certificate_id,
            "regId":       self.registration_id,
            "type":         self.cert_type,
            "date":         self.issue_date,
            "studentName": reg.student.name     if reg and reg.student else "-",
            "eventName":   reg.event.event_name if reg and reg.event   else "-"
        }


def seed_data():
    if Department.query.count() > 0:
        return

    depts = [
        Department(dept_name="CSE",   hod_name="Dr. Ravi"),
        Department(dept_name="ECE",   hod_name="Dr. Meena"),
        Department(dept_name="MECH",  hod_name="Dr. Prakash"),
        Department(dept_name="CIVIL", hod_name="Dr. Suresh"),
        Department(dept_name="EEE",   hod_name="Dr. Lakshmi"),
    ]
    db.session.add_all(depts)
    db.session.flush()

    venues = [
        Venue(venue_name="Main Auditorium", capacity=500,  block="A",       floor=1),
        Venue(venue_name="Seminar Hall 1",  capacity=150,  block="B",       floor=2),
        Venue(venue_name="Conference Room", capacity=80,   block="C",       floor=1),
        Venue(venue_name="Open Ground",     capacity=1000, block="Outdoor", floor=0),
        Venue(venue_name="Lab Complex",     capacity=120,  block="D",       floor=3),
    ]
    db.session.add_all(venues)
    db.session.flush()

    events = [
        Event(event_name="Hackathon 2026",     event_date="2026-03-15", event_type="Technical",    reg_fee=200, department_id=1, venue_id=1),
        Event(event_name="Robotics Workshop",  event_date="2026-04-10", event_type="Technical",    reg_fee=300, department_id=2, venue_id=5),
        Event(event_name="Cultural Fest",      event_date="2026-05-05", event_type="Cultural",     reg_fee=150, department_id=4, venue_id=4),
        Event(event_name="Paper Presentation", event_date="2026-03-25", event_type="Technical",    reg_fee=100, department_id=1, venue_id=2),
        Event(event_name="Sports Meet",        event_date="2026-06-01", event_type="Sports",       reg_fee=50,  department_id=3, venue_id=4),
    ]
    db.session.add_all(events)
    db.session.flush()

    students = [
        Student(name="Manish N",   email="manish@gmail.com", phone="9876543210", year=3, department_id=1),
        Student(name="Arun Kumar", email="arun@gmail.com",   phone="9123456780", year=2, department_id=2),
        Student(name="Sneha R",    email="sneha@gmail.com",  phone="9988776655", year=1, department_id=3),
        Student(name="Rahul V",    email="rahul@gmail.com",  phone="9876123456", year=4, department_id=1),
        Student(name="Divya S",    email="divya@gmail.com",  phone="9090909090", year=2, department_id=5),
    ]
    db.session.add_all(students)
    db.session.flush()

    regs = [
        Registration(reg_date="2026-03-01", status="Confirmed", attendance="Present", student_id=1, event_id=1),
        Registration(reg_date="2026-03-05", status="Confirmed", attendance="Present", student_id=2, event_id=2),
        Registration(reg_date="2026-04-01", status="Pending",   attendance="Absent",  student_id=3, event_id=3),
        Registration(reg_date="2026-03-10", status="Confirmed", attendance="Present", student_id=4, event_id=4),
        Registration(reg_date="2026-05-15", status="Confirmed", attendance="Present", student_id=5, event_id=5),
    ]
    db.session.add_all(regs)
    db.session.flush()

    payments = [
        Payment(registration_id=1, amount=200, mode="UPI",         pay_date="2026-03-01", status="Paid"),
        Payment(registration_id=2, amount=300, mode="Credit Card", pay_date="2026-03-05", status="Paid"),
        Payment(registration_id=3, amount=150, mode="Cash",         pay_date="2026-04-01", status="Pending"),
        Payment(registration_id=4, amount=100, mode="UPI",         pay_date="2026-03-10", status="Paid"),
        Payment(registration_id=5, amount=50,  mode="Debit Card",  pay_date="2026-05-15", status="Paid"),
    ]
    db.session.add_all(payments)
    db.session.flush()

    certs = [
        Certificate(registration_id=1, cert_type="Participation", issue_date="2026-03-20"),
        Certificate(registration_id=2, cert_type="Participation", issue_date="2026-04-15"),
        Certificate(registration_id=4, cert_type="Merit",         issue_date="2026-03-30"),
        Certificate(registration_id=5, cert_type="Winner",        issue_date="2026-06-05"),
    ]
    db.session.add_all(certs)
    db.session.commit()
    print("✅ Database seeded with DA-2 data.")


USERS = {
    "admin": {"password": "admin123", "name": "Manish N",   "role": "Admin"},
    "staff": {"password": "staff123", "name": "Arun Kumar", "role": "Staff"},
}

@app.route("/")
def root():
    return redirect(url_for("login_page"))

@app.route("/login", methods=["GET"])
def login_page():
    if "user" in session:
        return redirect(url_for("dashboard"))
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def do_login():
    data = request.get_json()
    u = data.get("username", "")
    p = data.get("password", "")
    user = USERS.get(u)
    if user and user["password"] == p:
        session["user"] = {"username": u, "name": user["name"], "role": user["role"]}
        return jsonify({"success": True, "name": user["name"], "role": user["role"]})
    return jsonify({"success": False, "message": "Invalid username or password."}), 401

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login_page"))

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login_page"))
    return render_template("index.html", user=session["user"])

def login_required(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return wrapper

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        if session["user"].get("role") != "Admin":
            return jsonify({"error": "Forbidden"}), 403
        return f(*args, **kwargs)
    return wrapper


@app.route("/api/departments", methods=["GET"])
@login_required
def get_departments():
    depts = Department.query.all()
    result = []
    for d in depts:
        data = d.to_dict()
        data["eventCount"] = Event.query.filter_by(department_id=d.department_id).count()
        result.append(data)
    return jsonify(result)

@app.route("/api/departments", methods=["POST"])
@admin_required
def add_department():
    data = request.get_json()
    name = data.get("name","").strip()
    hod  = data.get("hod","").strip()
    if not name or not hod:
        return jsonify({"error": "Name and HOD are required."}), 400
    d = Department(dept_name=name, hod_name=hod)
    db.session.add(d)
    db.session.commit()
    return jsonify(d.to_dict()), 201

@app.route("/api/departments/<int:id>", methods=["PUT"])
@admin_required
def update_department(id):
    d = Department.query.get_or_404(id)
    data = request.get_json()
    d.dept_name = data.get("name", d.dept_name).strip()
    d.hod_name  = data.get("hod",  d.hod_name).strip()
    db.session.commit()
    return jsonify(d.to_dict())

@app.route("/api/departments/<int:id>", methods=["DELETE"])
@admin_required
def delete_department(id):
    d = Department.query.get_or_404(id)
    if Event.query.filter_by(department_id=id).count() > 0:
        return jsonify({"error": "Cannot delete — events are linked to this department."}), 400
    db.session.delete(d)
    db.session.commit()
    return jsonify({"message": "Deleted."})


@app.route("/api/venues", methods=["GET"])
@login_required
def get_venues():
    return jsonify([v.to_dict() for v in Venue.query.all()])

@app.route("/api/venues", methods=["POST"])
@admin_required
def add_venue():
    data = request.get_json()
    name     = data.get("name","").strip()
    capacity = data.get("capacity")
    block    = data.get("block","").strip()
    floor    = data.get("floor", 0)
    if not name or not capacity or not block:
        return jsonify({"error": "All fields are required."}), 400
    v = Venue(venue_name=name, capacity=int(capacity), block=block, floor=int(floor))
    db.session.add(v)
    db.session.commit()
    return jsonify(v.to_dict()), 201

@app.route("/api/venues/<int:id>", methods=["PUT"])
@admin_required
def update_venue(id):
    v = Venue.query.get_or_404(id)
    data = request.get_json()
    v.venue_name = data.get("name",     v.venue_name).strip()
    v.capacity   = int(data.get("capacity", v.capacity))
    v.block      = data.get("block",    v.block).strip()
    v.floor      = int(data.get("floor", v.floor))
    db.session.commit()
    return jsonify(v.to_dict())

@app.route("/api/venues/<int:id>", methods=["DELETE"])
@admin_required
def delete_venue(id):
    v = Venue.query.get_or_404(id)
    if Event.query.filter_by(venue_id=id).count() > 0:
        return jsonify({"error": "Cannot delete — events are using this venue."}), 400
    db.session.delete(v)
    db.session.commit()
    return jsonify({"message": "Deleted."})


@app.route("/api/events", methods=["GET"])
@login_required
def get_events():
    result = []
    for e in Event.query.all():
        data = e.to_dict()
        data["regCount"] = Registration.query.filter_by(event_id=e.event_id).count()
        result.append(data)
    return jsonify(result)

@app.route("/api/events", methods=["POST"])
@admin_required
def add_event():
    data = request.get_json()
    name    = data.get("name","").strip()
    ev_date = data.get("date","")
    ev_type = data.get("type","Technical")
    fee     = data.get("fee", 0)
    dept_id = data.get("deptId")
    ven_id  = data.get("venueId")
    if not name or not ev_date:
        return jsonify({"error": "Name and date are required."}), 400
    e = Event(event_name=name, event_date=ev_date, event_type=ev_type,
              reg_fee=float(fee), department_id=int(dept_id), venue_id=int(ven_id))
    db.session.add(e)
    db.session.commit()
    return jsonify(e.to_dict()), 201

@app.route("/api/events/<int:id>", methods=["PUT"])
@admin_required
def update_event(id):
    e = Event.query.get_or_404(id)
    data = request.get_json()
    e.event_name    = data.get("name",    e.event_name).strip()
    e.event_date    = data.get("date",    e.event_date)
    e.event_type    = data.get("type",    e.event_type)
    e.reg_fee       = float(data.get("fee", e.reg_fee))
    e.department_id = int(data.get("deptId",  e.department_id))
    e.venue_id      = int(data.get("venueId", e.venue_id))
    db.session.commit()
    return jsonify(e.to_dict())

@app.route("/api/events/<int:id>", methods=["DELETE"])
@admin_required
def delete_event(id):
    e = Event.query.get_or_404(id)
    if Registration.query.filter_by(event_id=id).count() > 0:
        return jsonify({"error": "Cannot delete — students are registered for this event."}), 400
    db.session.delete(e)
    db.session.commit()
    return jsonify({"message": "Deleted."})


@app.route("/api/students", methods=["GET"])
@login_required
def get_students():
    result = []
    for s in Student.query.all():
        data = s.to_dict()
        data["regCount"] = Registration.query.filter_by(student_id=s.student_id).count()
        result.append(data)
    return jsonify(result)

@app.route("/api/students", methods=["POST"])
@admin_required
def add_student():
    data  = request.get_json()
    name  = data.get("name","").strip()
    email = data.get("email","").strip()
    phone = data.get("phone","").strip()
    year  = data.get("year", 1)
    dept_id = data.get("deptId")
    if not name or not email or not phone:
        return jsonify({"error": "All fields are required."}), 400
    if len(phone) != 10 or not phone.isdigit():
        return jsonify({"error": "Phone must be 10 digits."}), 400
    if Student.query.filter_by(email=email).first():
        return jsonify({"error": "This email is already registered."}), 400
    s = Student(name=name, email=email, phone=phone, year=int(year), department_id=int(dept_id))
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201

@app.route("/api/students/<int:id>", methods=["PUT"])
@admin_required
def update_student(id):
    s    = Student.query.get_or_404(id)
    data = request.get_json()
    email = data.get("email", s.email).strip()
    phone = data.get("phone", s.phone).strip()
    if len(phone) != 10 or not phone.isdigit():
        return jsonify({"error": "Phone must be 10 digits."}), 400
    dup = Student.query.filter(Student.email == email, Student.student_id != id).first()
    if dup:
        return jsonify({"error": "This email is already used by another student."}), 400
    s.name          = data.get("name",  s.name).strip()
    s.email         = email
    s.phone         = phone
    s.year          = int(data.get("year",   s.year))
    s.department_id = int(data.get("deptId", s.department_id))
    db.session.commit()
    return jsonify(s.to_dict())

@app.route("/api/students/<int:id>", methods=["DELETE"])
@admin_required
def delete_student(id):
    s = Student.query.get_or_404(id)
    if Registration.query.filter_by(student_id=id).count() > 0:
        return jsonify({"error": "Cannot delete — student has existing registrations."}), 400
    db.session.delete(s)
    db.session.commit()
    return jsonify({"message": "Deleted."})


@app.route("/api/registrations", methods=["GET"])
@login_required
def get_registrations():
    return jsonify([r.to_dict() for r in Registration.query.all()])

@app.route("/api/registrations", methods=["POST"])
@login_required
def add_registration():
    data       = request.get_json()
    student_id = int(data.get("studentId"))
    event_id   = int(data.get("eventId"))
    reg_date   = data.get("date", str(date.today()))
    status     = data.get("status", "Confirmed")
    attendance = data.get("attendance", "Present")

    dup = Registration.query.filter_by(student_id=student_id, event_id=event_id).first()
    if dup:
        return jsonify({"error": "This student is already registered for this event."}), 400

    r = Registration(reg_date=reg_date, status=status, attendance=attendance,
                     student_id=student_id, event_id=event_id)
    db.session.add(r)
    db.session.flush()

    ev = Event.query.get(event_id)
    p  = Payment(registration_id=r.registration_id, amount=ev.reg_fee if ev else 0,
                 mode="Pending", pay_date=reg_date, status="Pending")
    db.session.add(p)
    db.session.commit()
    return jsonify(r.to_dict()), 201

@app.route("/api/registrations/<int:id>", methods=["PUT"])
@login_required
def update_registration(id):
    r = Registration.query.get_or_404(id)
    data = request.get_json()
    r.status     = data.get("status",     r.status)
    r.attendance = data.get("attendance", r.attendance)
    db.session.commit()
    return jsonify(r.to_dict())

@app.route("/api/registrations/<int:id>", methods=["DELETE"])
@admin_required
def delete_registration(id):
    r = Registration.query.get_or_404(id)
    if r.payment:
        db.session.delete(r.payment)
    if r.certificate:
        db.session.delete(r.certificate)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Registration and related records deleted."})


@app.route("/api/payments", methods=["GET"])
@login_required
def get_payments():
    return jsonify([p.to_dict() for p in Payment.query.all()])

@app.route("/api/payments/<int:id>", methods=["PUT"])
@login_required
def update_payment(id):
    p = Payment.query.get_or_404(id)
    data = request.get_json()
    p.mode     = data.get("mode",   p.mode)
    p.pay_date = data.get("date",   p.pay_date)
    p.status   = data.get("status", p.status)
    db.session.commit()
    return jsonify(p.to_dict())


@app.route("/api/certificates", methods=["GET"])
@login_required
def get_certificates():
    return jsonify([c.to_dict() for c in Certificate.query.all()])

@app.route("/api/eligible-registrations", methods=["GET"])
@login_required
def eligible_for_cert():
    already = {c.registration_id for c in Certificate.query.all()}
    regs = Registration.query.filter_by(attendance="Present").all()
    eligible = [r.to_dict() for r in regs if r.registration_id not in already]
    return jsonify(eligible)

@app.route("/api/certificates", methods=["POST"])
@login_required
def add_certificate():
    data   = request.get_json()
    reg_id = int(data.get("regId"))
    ctype  = data.get("type", "Participation")
    c
