const STORAGE_KEY = "coopchain_user_v2";
const REGISTRATIONS_KEY = "coopchain_registrations_v1";

function getUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

function setUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  refreshAuthUI();
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
  refreshAuthUI();
}

function getRegistrations() {
  try { return JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || "[]"); }
  catch { return []; }
}

function saveRegistrations(list) {
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(list));
}

function appendRegistration(entry) {
  const regs = getRegistrations();
  regs.push(entry);
  saveRegistrations(regs);
}

function exportRegistrationsCSV() {
  const regs = getRegistrations();
  if (!regs.length) {
    alert("No hay registros para exportar.");
    return;
  }

  const headers = ["nombre","apellido","email","empresa","rol","createdAt"];
  const rows = regs.map(r => headers.map(h => {
    const v = r[h] || "";
    return `"${String(v).replace(/"/g,'""')}"`;
  }).join(","));

  const csv = [headers.join(","), ...rows].join("\r\n");
  const now = new Date();
  const pad = n => String(n).padStart(2,"0");
  const fname = `registrations-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
  downloadBlob(fname, csv, "text/csv;charset=utf-8;");
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime || "application/octet-stream" });
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 100);
  }
}

function refreshAuthUI() {
  const user = getUser();

  document.querySelectorAll("[data-auth-label]").forEach(el => {
    el.textContent = user ? `Hola, ${user.nombre}` : "Ingresar / Registrarse";
  });

  document.querySelectorAll("[data-requires-auth]").forEach(el => {
    const directHref = el.getAttribute("href");
    if (!user && directHref && !directHref.includes("registro.html")) {
      el.setAttribute("data-target", directHref);
      el.setAttribute("href", `registro.html?next=${encodeURIComponent(directHref)}`);
    } else if (user && el.dataset.target) {
      el.setAttribute("href", el.dataset.target);
    }
  });

  document.querySelectorAll("[data-user-only]").forEach(el => {
    el.classList.toggle("hidden", !user);
  });

  document.querySelectorAll("[data-guest-only]").forEach(el => {
    el.classList.toggle("hidden", !!user);
  });
}

function guardProtectedPages() {
  const protectedPage = document.body.dataset.protectedPage === "true";
  if (!protectedPage) return;
  const user = getUser();
  if (!user) {
    const current = window.location.pathname.split("/").pop() || "dialogar-con-el-libro.html";
    window.location.href = `registro.html?next=${encodeURIComponent(current)}`;
  }
}

function handleRegistrationForm() {
  const form = document.querySelector("#registration-form");
  if (!form) return;
  const next = new URLSearchParams(location.search).get("next") || "dialogar-con-el-libro.html";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      nombre: (data.get("nombre") || "").toString().trim(),
      apellido: (data.get("apellido") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      empresa: (data.get("empresa") || "").toString().trim(),
      rol: (data.get("rol") || "").toString().trim(),
      createdAt: new Date().toISOString()
    };

    if (!payload.nombre || !payload.apellido || !payload.email) {
      alert("Completa nombre, apellido y email");
      return;
    }

    // keep existing behavior (session)
    setUser(payload);

    // append to local registrations list so you can export later
    appendRegistration({
      nombre: payload.nombre,
      apellido: payload.apellido,
      email: payload.email,
      empresa: payload.empresa,
      rol: payload.rol,
      createdAt: payload.createdAt
    });

    // optional: show a brief confirmation
    try {
      const note = document.querySelector("#registro-guardado-note");
      if (note) {
        note.classList.remove("hidden");
        setTimeout(() => note.classList.add("hidden"), 1500);
      }
    } catch (e) {}

    // redirect to next
    window.location.href = next;
  });
}

function injectPromptLinks() {
  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      const prompt = button.getAttribute("data-prompt") || "";
      const output = document.querySelector("#starter-output");
      if (output) {
        output.value = prompt;
        output.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(prompt).catch(() => {});
      }
      const note = document.querySelector("#copied-note");
      if (note) {
        note.classList.remove("hidden");
        setTimeout(() => note.classList.add("hidden"), 1800);
      }
    });
  });
}

function bindExportButton() {
  const btn = document.querySelector("#export-registrations");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    exportRegistrationsCSV();
  });

  // show/hide button if there are registrations
  const regs = getRegistrations();
  btn.classList.toggle("hidden", regs.length === 0);
}

function bindLogout() {
  document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      clearUser();
      window.location.href = "index.html";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  guardProtectedPages();
  refreshAuthUI();
  handleRegistrationForm();
  injectPromptLinks();
  bindExportButton();
  bindLogout();
});
