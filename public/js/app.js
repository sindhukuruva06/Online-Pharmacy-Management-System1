const page = document.body.dataset.page;
const currency = value => `₹${Number(value || 0).toFixed(2)}`;

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

if (page === "dashboard") {
  loadDashboard();
}

async function loadDashboard() {
  const status = document.getElementById("connection-status");
  try {
    const data = await api("/api/dashboard");
    document.getElementById("users-count").textContent = data.users;
    document.getElementById("medicines-count").textContent = data.medicines;
    document.getElementById("orders-count").textContent = data.orders;
    document.getElementById("items-count").textContent = data.items;
    status.textContent = "● Database connected successfully";
    status.style.color = "#0b8f83";
  } catch (error) {
    status.textContent = `● ${error.message} Check your .env file and MySQL server.`;
    status.style.color = "#c0392b";
  }
}

const configurations = {
  users: {
    endpoint: "users", id: "user_id",
    fields: ["name", "email", "password", "phone", "role"],
    headings: ["user_id", "name", "email", "phone", "role"],
    labels: ["ID", "Name", "Email", "Phone", "Role"],
    format: (row, key) => key === "password" ? "••••••••" : (row[key] ?? "—")
  },
  medicines: {
    endpoint: "medicines", id: "medicine_id",
    fields: ["medicine_name", "category", "manufacturer", "price", "stock", "expiry_date"],
    headings: ["medicine_id", "medicine_name", "category", "manufacturer", "price", "stock", "expiry_date"],
    labels: ["ID", "Medicine", "Category", "Manufacturer", "Price", "Stock", "Expiry"],
    format: (row, key) => key === "price" ? currency(row[key]) : (row[key] ?? "—")
  },
  orders: {
    endpoint: "orders", id: "order_id",
    fields: ["user_id", "order_date", "total_amount", "status"],
    headings: ["order_id", "user_id", "customer_name", "order_date", "total_amount", "status"],
    labels: ["ID", "User ID", "Customer", "Order date", "Total", "Status"],
    format: (row, key) => key === "total_amount" ? currency(row[key]) : (row[key] ?? "—")
  },
  "order-items": {
    endpoint: "order-items", id: "item_id",
    fields: ["order_id", "medicine_id", "quantity", "price"],
    headings: ["item_id", "order_id", "medicine_id", "medicine_name", "quantity", "price"],
    labels: ["Item ID", "Order ID", "Medicine ID", "Medicine", "Quantity", "Unit price"],
    format: (row, key) => key === "price" ? currency(row[key]) : (row[key] ?? "—")
  }
};

if (configurations[page]) setupCrud(configurations[page]);

function setupCrud(config) {
  const form = document.getElementById("record-form");
  const tbody = document.getElementById("table-body");
  const message = document.getElementById("form-message");
  const count = document.getElementById("record-count");
  const search = document.getElementById("table-search");
  let records = [];
  let editingId = null;

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
  }

  function resetForm() {
    form.reset();
    editingId = null;
    document.getElementById("form-title").textContent =
      page === "users" ? "Add user" :
      page === "medicines" ? "Add medicine" :
      page === "orders" ? "Add order" : "Add order item";
    const password = form.elements.namedItem("password");
    if (password) password.required = true;
    showMessage("");
  }

  function renderRows() {
    const term = (search.value || "").toLowerCase();
    const visible = records.filter(row =>
      Object.values(row).some(value => String(value ?? "").toLowerCase().includes(term))
    );
    count.textContent = `${visible.length} record(s)`;
    if (!visible.length) {
      tbody.innerHTML = `<tr><td class="empty-row" colspan="${config.headings.length + 1}">No records found.</td></tr>`;
      return;
    }
    tbody.innerHTML = visible.map(row => {
      const cells = config.headings.map(key => `<td>${escapeHtml(config.format(row, key))}</td>`).join("");
      return `<tr>${cells}<td>
        <button class="action-btn" data-action="edit" data-id="${row[config.id]}">Edit</button>
        <button class="action-btn delete" data-action="delete" data-id="${row[config.id]}">Delete</button>
      </td></tr>`;
    }).join("");
  }

  async function loadRecords() {
    try {
      records = await api(`/api/${config.endpoint}`);
      renderRows();
    } catch (error) {
      count.textContent = error.message;
      tbody.innerHTML = `<tr><td class="empty-row" colspan="${config.headings.length + 1}">Could not load records. Check database connection.</td></tr>`;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    for (const key of ["price", "stock", "user_id", "total_amount", "order_id", "medicine_id", "quantity"]) {
      if (data[key] !== undefined && data[key] !== "") data[key] = Number(data[key]);
    }
    if (page === "users" && !data.password) delete data.password;

    try {
      if (editingId) {
        await api(`/api/${config.endpoint}/${editingId}`, { method: "PUT", body: JSON.stringify(data) });
        showMessage("Record updated successfully.");
      } else {
        await api(`/api/${config.endpoint}`, { method: "POST", body: JSON.stringify(data) });
        showMessage("Record added successfully.");
      }
      resetForm();
      showMessage("Saved successfully.");
      await loadRecords();
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  tbody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    const row = records.find(item => String(item[config.id]) === String(id));
    if (!row) return;

    if (action === "edit") {
      editingId = id;
      for (const field of config.fields) {
        const input = form.elements.namedItem(field);
        if (input) input.value = field === "password" ? "" : (row[field] ?? "");
      }
      const password = form.elements.namedItem("password");
      if (password) password.required = false;
      document.getElementById("form-title").textContent = "Edit record";
      showMessage("Update the required fields and save.");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "delete") {
      if (!confirm(`Delete record #${id}? This action cannot be undone.`)) return;
      try {
        await api(`/api/${config.endpoint}/${id}`, { method: "DELETE" });
        await loadRecords();
        showMessage("Record deleted successfully.");
      } catch (error) {
        showMessage(error.message, true);
      }
    }
  });

  document.getElementById("cancel-edit").addEventListener("click", resetForm);
  search.addEventListener("input", renderRows);
  loadRecords();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
