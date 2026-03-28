async function api(method, url, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

function toast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent   = msg;
  t.style.background = isError ? "#c0392b" : "#1e2a40";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function badge(text) {
  const cls = (text || "").toLowerCase().replace(/\s+/g, "-");
  return `<span class="badge badge-${cls}">${text}</span>`;
}

function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
function closeOutside(e, id) { if (e.target.id === id) closeModal(id); }

function confirmDelete(msg, onYes) {
  document.getElementById("confirm-msg").textContent = msg;
  const btn = document.getElementById("confirm-yes-btn");
  btn.onclick = () => { onYes(); closeModal("confirm-overlay"); };
  openModal("confirm-overlay");
}

function showPage(id, el) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".sidebar-menu li").forEach(l => l.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (el) el.classList.add("active");
  const titles = {
    dashboard:"Dashboard", departments:"Departments", venues:"Venues",
    students:"Students", events:"Events", registrations:"Registrations",
    payments:"Payments", certificates:"Certificates"
  };
  document.getElementById("pageHeading").textContent = titles[id] || id;
  const renders = {
    dashboard: renderDashboard,
    departments: renderDepts,
    venues: renderVenues,
    students: renderStudents,
    events: renderEvents,
    registrations: renderRegistrations,
    payments: renderPayments,
    certificates: renderCerts
  };
  if (renders[id]) renders[id]();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("hidden");
  document.getElementById("mainContent").classList.toggle("full");
}

async function renderDashboard() {
  try {
    const [stats, regs, events] = await Promise.all([
      api("GET", "/api/stats"),
      api("GET", "/api/registrations"),
      api("GET", "/api/events")
    ]);

    document.getElementById("count-events").textContent         = stats.events;
    document.getElementById("count-students").textContent       = stats.students;
    document.getElementById("count-registrations").textContent = stats.registrations;
    document.getElementById("count-revenue").textContent        = "₹" + stats.revenue;

    const tbody1 = document.getElementById("dash-recent-body");
    tbody1.innerHTML = "";
    [...regs].reverse().slice(0, 5).forEach(r => {
      tbody1.innerHTML += `<tr>
        <td>${r.studentName}</td>
        <td>${r.eventName}</td>
        <td>${badge(r.status)}</td>
      </tr>`;
    });

    const tbody2 = document.getElementById("dash-events-body");
    tbody2.innerHTML = "";
    events.slice(0, 5).forEach(e => {
      tbody2.innerHTML += `<tr>
        <td>${e.name}</td>
        <td>${e.date}</td>
        <td>₹${e.fee}</td>
      </tr>`;
    });
  } catch (err) {
    toast("Failed to load dashboard: " + err.message, true);
  }
}

async function renderDepts() {
  try {
    const depts = await api("GET", "/api/departments");
    const tbody = document.getElementById("dept-body");
    tbody.innerHTML = "";
    depts.forEach(d => {
      tbody.innerHTML += `<tr>
        <td>${d.id}</td>
        <td>${d.name}</td>
        <td>${d.hod}</td>
        <td>${d.eventCount}</td>
        <td>
          ${window.userRole === 'Admin' ? `
          <button class="btn-edit" onclick="openDeptModal(${d.id},'${d.name}','${d.hod}')">Edit</button>
          <button class="btn-delete" onclick="deleteDept(${d.id},'${d.name}')">Delete</button>
          ` : '-'}
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

function openDeptModal(id = null, name = "", hod = "") {
  document.getElementById("dept-modal-title").textContent = id ? "Edit Department" : "Add Department";
  document.getElementById("d-edit-id").value = id || "";
  document.getElementById("d-name").value    = name;
  document.getElementById("d-hod").value     = hod;
  openModal("dept-modal");
}

async function saveDept() {
  const id   = document.getElementById("d-edit-id").value;
  const name = document.getElementById("d-name").value.trim();
  const hod  = document.getElementById("d-hod").value.trim();
  if (!name || !hod) { toast("Please fill all fields.", true); return; }
  try {
    if (id) {
      await api("PUT", `/api/departments/${id}`, { name, hod });
      toast("Department updated.");
    } else {
      await api("POST", "/api/departments", { name, hod });
      toast("Department added.");
    }
    closeModal("dept-modal");
    renderDepts();
  } catch (err) { toast(err.message, true); }
}

function deleteDept(id, name) {
  confirmDelete(`Delete department "${name}"?`, async () => {
    try {
      await api("DELETE", `/api/departments/${id}`);
      toast("Department deleted.");
      renderDepts();
    } catch (err) { toast(err.message, true); }
  });
}

async function renderVenues() {
  try {
    const venues = await api("GET", "/api/venues");
    const tbody  = document.getElementById("venue-body");
    tbody.innerHTML = "";
    venues.forEach(v => {
      tbody.innerHTML += `<tr>
        <td>${v.id}</td>
        <td>${v.name}</td>
        <td>${v.capacity}</td>
        <td>${v.block}</td>
        <td>${v.floor}</td>
        <td>
          ${window.userRole === 'Admin' ? `
          <button class="btn-edit" onclick='openVenueModal(${JSON.stringify(v)})'>Edit</button>
          <button class="btn-delete" onclick="deleteVenue(${v.id},'${v.name}')">Delete</button>
          ` : '-'}
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

function openVenueModal(v = null) {
  document.getElementById("venue-modal-title").textContent = v ? "Edit Venue" : "Add Venue";
  document.getElementById("v-edit-id").value  = v ? v.id : "";
  document.getElementById("v-name").value     = v ? v.name : "";
  document.getElementById("v-capacity").value = v ? v.capacity : "";
  document.getElementById("v-block").value    = v ? v.block : "";
  document.getElementById("v-floor").value    = v ? v.floor : "";
  openModal("venue-modal");
}

async function saveVenue() {
  const id       = document.getElementById("v-edit-id").value;
  const name     = document.getElementById("v-name").value.trim();
  const capacity = document.getElementById("v-capacity").value;
  const block    = document.getElementById("v-block").value.trim();
  const floor    = document.getElementById("v-floor").value || 0;
  if (!name || !capacity || !block) { toast("Please fill all fields.", true); return; }
  try {
    const body = { name, capacity, block, floor };
    if (id) { await api("PUT", `/api/venues/${id}`, body); toast("Venue updated."); }
    else    { await api("POST", "/api/venues", body);      toast("Venue added.");   }
    closeModal("venue-modal");
    renderVenues();
  } catch (err) { toast(err.message, true); }
}

function deleteVenue(id, name) {
  confirmDelete(`Delete venue "${name}"?`, async () => {
    try {
      await api("DELETE", `/api/venues/${id}`);
      toast("Venue deleted.");
      renderVenues();
    } catch (err) { toast(err.message, true); }
  });
}

let allStudents = [];

async function renderStudents() {
  try {
    if (allStudents.length === 0) allStudents = await api("GET", "/api/students");
    const q     = (document.getElementById("student-search")?.value || "").toLowerCase();
    const list  = allStudents.filter(s => s.name.toLowerCase().includes(q) || String(s.id).includes(q));
    const tbody = document.getElementById("student-body");
    tbody.innerHTML = "";
    list.forEach(s => {
      tbody.innerHTML += `<tr>
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.email}</td>
        <td>${s.phone}</td>
        <td>Year ${s.year}</td>
        <td>${s.deptName}</td>
        <td>${s.regCount} event${s.regCount !== 1 ? "s" : ""}</td>
        <td>
          ${window.userRole === 'Admin' ? `
          <button class="btn-edit" onclick='openStudentModal(${JSON.stringify(s)})'>Edit</button>
          <button class="btn-delete" onclick="deleteStudent(${s.id},'${s.name}')">Delete</button>
          ` : '-'}
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

async function openStudentModal(s = null) {
  document.getElementById("student-modal-title").textContent = s ? "Edit Student" : "Add Student";
  document.getElementById("s-edit-id").value = s ? s.id : "";
  document.getElementById("s-name").value    = s ? s.name : "";
  document.getElementById("s-email").value   = s ? s.email : "";
  document.getElementById("s-phone").value   = s ? s.phone : "";
  document.getElementById("s-year").value    = s ? s.year : "1";

  const depts  = await api("GET", "/api/departments");
  const dSel   = document.getElementById("s-dept");
  dSel.innerHTML = "";
  depts.forEach(d => {
    const o = document.createElement("option");
    o.value = d.id; o.textContent = d.name;
    if (s && d.id == s.deptId) o.selected = true;
    dSel.appendChild(o);
  });
  openModal("student-modal");
}

async function saveStudent() {
  const id    = document.getElementById("s-edit-id").value;
  const name  = document.getElementById("s-name").value.trim();
  const email = document.getElementById("s-email").value.trim();
  const phone = document.getElementById("s-phone").value.trim();
  const year  = document.getElementById("s-year").value;
  const deptId= document.getElementById("s-dept").value;
  if (!name || !email || !phone) { toast("All fields are required.", true); return; }
  try {
    const body = { name, email, phone, year, deptId };
    if (id) { await api("PUT", `/api/students/${id}`, body); toast("Student updated."); }
    else    { await api("POST", "/api/students", body);      toast("Student added.");   }
    allStudents = [];
    closeModal("student-modal");
    renderStudents();
  } catch (err) { toast(err.message, true); }
}

function deleteStudent(id, name) {
  confirmDelete(`Delete student "${name}"?`, async () => {
    try {
      await api("DELETE", `/api/students/${id}`);
      toast("Student deleted.");
      allStudents = [];
      renderStudents();
    } catch (err) { toast(err.message, true); }
  });
}

let allEvents = [];

async function renderEvents() {
  try {
    if (allEvents.length === 0) allEvents = await api("GET", "/api/events");
    const q     = (document.getElementById("event-search")?.value || "").toLowerCase();
    const list  = allEvents.filter(e => e.name.toLowerCase().includes(q));
    const tbody = document.getElementById("event-body");
    tbody.innerHTML = "";
    list.forEach(e => {
      tbody.innerHTML += `<tr>
        <td>${e.id}</td>
        <td>${e.name}</td>
        <td>${e.date}</td>
        <td>${e.type}</td>
        <td>₹${e.fee}</td>
        <td>${e.deptName}</td>
        <td>${e.venueName}</td>
        <td>${e.regCount}</td>
        <td>
          ${window.userRole === 'Admin' ? `
          <button class="btn-edit" onclick='openEventModal(${JSON.stringify(e)})'>Edit</button>
          <button class="btn-delete" onclick="deleteEvent(${e.id},'${e.name}')">Delete</button>
          ` : '-'}
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

async function openEventModal(ev = null) {
  document.getElementById("event-modal-title").textContent = ev ? "Edit Event" : "Add Event";
  document.getElementById("e-edit-id").value = ev ? ev.id : "";
  document.getElementById("e-name").value    = ev ? ev.name : "";
  document.getElementById("e-date").value    = ev ? ev.date : "";
  document.getElementById("e-type").value    = ev ? ev.type : "Technical";
  document.getElementById("e-fee").value     = ev ? ev.fee : "";

  const [depts, venues] = await Promise.all([
    api("GET", "/api/departments"),
    api("GET", "/api/venues")
  ]);

  const dSel = document.getElementById("e-dept");
  dSel.innerHTML = "";
  depts.forEach(d => {
    const o = document.createElement("option");
    o.value = d.id; o.textContent = d.name;
    if (ev && d.id == ev.deptId) o.selected = true;
    dSel.appendChild(o);
  });

  const vSel = document.getElementById("e-venue");
  vSel.innerHTML = "";
  venues.forEach(v => {
    const o = document.createElement("option");
    o.value = v.id; o.textContent = `${v.name} (Cap: ${v.capacity})`;
    if (ev && v.id == ev.venueId) o.selected = true;
    vSel.appendChild(o);
  });

  openModal("event-modal");
}

async function saveEvent() {
  const id      = document.getElementById("e-edit-id").value;
  const name    = document.getElementById("e-name").value.trim();
  const date    = document.getElementById("e-date").value;
  const type    = document.getElementById("e-type").value;
  const fee     = document.getElementById("e-fee").value;
  const deptId  = document.getElementById("e-dept").value;
  const venueId = document.getElementById("e-venue").value;
  if (!name || !date) { toast("Name and date are required.", true); return; }
  try {
    const body = { name, date, type, fee, deptId, venueId };
    if (id) { await api("PUT", `/api/events/${id}`, body); toast("Event updated."); }
    else    { await api("POST", "/api/events", body);      toast("Event added.");   }
    allEvents = [];
    closeModal("event-modal");
    renderEvents();
  } catch (err) { toast(err.message, true); }
}

function deleteEvent(id, name) {
  confirmDelete(`Delete event "${name}"?`, async () => {
    try {
      await api("DELETE", `/api/events/${id}`);
      toast("Event deleted.");
      allEvents = [];
      renderEvents();
    } catch (err) { toast(err.message, true); }
  });
}

async function renderRegistrations() {
  try {
    const regs  = await api("GET", "/api/registrations");
    const q     = (document.getElementById("reg-search")?.value || "").toLowerCase();
    const list  = regs.filter(r =>
      r.studentName.toLowerCase().includes(q) || r.eventName.toLowerCase().includes(q)
    );
    const tbody = document.getElementById("reg-body");
    tbody.innerHTML = "";
    list.forEach(r => {
      tbody.innerHTML += `<tr>
        <td>${r.id}</td>
        <td>${r.studentName}</td>
        <td>${r.eventName}</td>
        <td>${r.date}</td>
        <td>${badge(r.status)}</td>
        <td>${badge(r.attendance)}</td>
        <td>${badge(r.payStatus)}</td>
        <td>
          <button class="btn-edit" onclick='openRegModal(${JSON.stringify(r)})'>Edit</button>
          ${window.userRole === 'Admin' ? `<button class="btn-delete" onclick="deleteReg(${r.id})">Delete</button>` : ''}
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

async function showEventFee() {
  const evId = document.getElementById("r-event").value;
  if (!evId) return;
  if (allEvents.length === 0) allEvents = await api("GET", "/api/events");
  const ev   = allEvents.find(e => e.id == evId);
  const prev = document.getElementById("fee-preview");
  if (ev) {
    document.getElementById("fee-preview-amount").textContent = "₹" + ev.fee;
    prev.style.display = "block";
  }
}

async function openRegModal(r = null) {
  document.getElementById("reg-modal-title").textContent = r ? "Edit Registration" : "Register Student for Event";
  document.getElementById("r-edit-id").value    = r ? r.id : "";
  document.getElementById("r-status").value     = r ? r.status : "Confirmed";
  document.getElementById("r-attendance").value = r ? r.attendance : "Present";
  document.getElementById("reg-save-btn").textContent = r ? "Update" : "Register";

  const newFields  = document.getElementById("r-new-fields");
  const editFields = document.getElementById("r-edit-fields");

  if (r) {
    newFields.style.display  = "none";
    editFields.style.display = "block";
    document.getElementById("r-edit-student-name").textContent = r.studentName;
    document.getElementById("r-edit-event-name").textContent   = r.eventName;
  } else {
    newFields.style.display  = "block";
    editFields.style.display = "none";
    document.getElementById("fee-preview").style.display = "none";

    const [students, events] = await Promise.all([
      api("GET", "/api/students"),
      api("GET", "/api/events")
    ]);
    allEvents = events;

    const sSel = document.getElementById("r-student");
    sSel.innerHTML = "";
    students.forEach(s => {
      const o = document.createElement("option");
      o.value = s.id; o.textContent = `${s.name} (${s.deptName})`;
      sSel.appendChild(o);
    });

    const eSel = document.getElementById("r-event");
    eSel.innerHTML = "";
    events.forEach(e => {
      const o = document.createElement("option");
      o.value = e.id; o.textContent = `${e.name} – ₹${e.fee}`;
      eSel.appendChild(o);
    });

    document.getElementById("r-date").value = new Date().toISOString().split("T")[0];
    showEventFee();
  }
  openModal("reg-modal");
}

async function saveRegistration() {
  const id         = document.getElementById("r-edit-id").value;
  const status     = document.getElementById("r-status").value;
  const attendance = document.getElementById("r-attendance").value;

  try {
    if (id) {
      await api("PUT", `/api/registrations/${id}`, { status, attendance });
      toast("Registration updated.");
    } else {
      const studentId = document.getElementById("r-student").value;
      const eventId   = document.getElementById("r-event").value;
      const date      = document.getElementById("r-date").value;
      if (!date) { toast("Please select a date.", true); return; }
      const r = await api("POST", "/api/registrations", { studentId, eventId, date, status, attendance });
      toast(`Registered successfully. Payment record auto-created.`);
    }
    closeModal("reg-modal");
    renderRegistrations();
  } catch (err) { toast(err.message, true); }
}

function deleteReg(id) {
  confirmDelete(`Delete registration #${id}? This will also remove the linked payment and certificate.`, async () => {
    try {
      await api("DELETE", `/api/registrations/${id}`);
      toast("Registration and related records deleted.");
      renderRegistrations();
    } catch (err) { toast(err.message, true); }
  });
}

async function renderPayments() {
  try {
    const pays  = await api("GET", "/api/payments");
    const q     = (document.getElementById("pay-search")?.value || "").toLowerCase();
    const list  = pays.filter(p =>
      p.studentName.toLowerCase().includes(q) || p.eventName.toLowerCase().includes(q)
    );
    const tbody = document.getElementById("payment-body");
    tbody.innerHTML = "";
    list.forEach(p => {
      tbody.innerHTML += `<tr>
        <td>${p.id}</td>
        <td>${p.studentName}</td>
        <td>${p.eventName}</td>
        <td>₹${p.amount}</td>
        <td>${p.mode}</td>
        <td>${p.date}</td>
        <td>${badge(p.status)}</td>
        <td>
          <button class="btn-edit" onclick='openPaymentModal(${JSON.stringify(p)})'>Update</button>
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

function openPaymentModal(p) {
  document.getElementById("p-edit-id").value           = p.id;
  document.getElementById("p-student-name").textContent = p.studentName;
  document.getElementById("p-event-name").textContent   = p.eventName;
  document.getElementById("p-amount-display").textContent = "₹" + p.amount;
  document.getElementById("p-mode").value   = p.mode;
  document.getElementById("p-date").value   = p.date;
  document.getElementById("p-status").value = p.status;
  openModal("payment-modal");
}

async function savePayment() {
  const id     = document.getElementById("p-edit-id").value;
  const mode   = document.getElementById("p-mode").value;
  const date   = document.getElementById("p-date").value;
  const status = document.getElementById("p-status").value;
  if (!date) { toast("Please enter a payment date.", true); return; }
  try {
    await api("PUT", `/api/payments/${id}`, { mode, date, status });
    toast("Payment updated.");
    closeModal("payment-modal");
    renderPayments();
  } catch (err) { toast(err.message, true); }
}

async function renderCerts() {
  try {
    const certs = await api("GET", "/api/certificates");
    const tbody = document.getElementById("cert-body");
    tbody.innerHTML = "";
    certs.forEach(c => {
      tbody.innerHTML += `<tr>
        <td>${c.id}</td>
        <td>${c.studentName}</td>
        <td>${c.eventName}</td>
        <td>${c.type}</td>
        <td>${c.date}</td>
        <td>
          ${window.userRole === 'Admin' ? `<button class="btn-delete" onclick="deleteCert(${c.id})">Revoke</button>` : 'Certified'}
        </td>
      </tr>`;
    });
  } catch (err) { toast(err.message, true); }
}

async function openCertModal() {
  const eligible = await api("GET", "/api/eligible-registrations");
  if (eligible.length === 0) {
    toast("No eligible students. Mark attendance as Present first, and ensure no cert already issued.", true);
    return;
  }
  const sel = document.getElementById("c-reg");
  sel.innerHTML = "";
  eligible.forEach(r => {
    const o = document.createElement("option");
    o.value = r.id;
    o.textContent = `${r.studentName} — ${r.eventName}`;
    sel.appendChild(o);
  });
  document.getElementById("c-type").value = "Participation";
  document.getElementById("c-date").value = new Date().toISOString().split("T")[0];
  openModal("cert-modal");
}

async function saveCertificate() {
  const regId = document.getElementById("c-reg").value;
  const type  = document.getElementById("c-type").value;
  const date  = document.getElementById("c-date").value;
  if (!date) { toast("Please enter issue date.", true); return; }
  try {
    await api("POST", "/api/certificates", { regId, type, date });
    toast("Certificate issued successfully.");
    closeModal("cert-modal");
    renderCerts();
  } catch (err) { toast(err.message, true); }
}

function deleteCert(id) {
  confirmDelete("Revoke this certificate?", async () => {
    try {
      await api("DELETE", `/api/certificates/${id}`);
      toast("Certificate revoked.");
      renderCerts();
    } catch (err) { toast(err.message, true); }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
});
