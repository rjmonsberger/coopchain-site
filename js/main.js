const STORAGE_KEY = "coopchain_user_v2";

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

function showMessage(text, type) {
  const container = document.querySelector('#registro-messages');
  if (!container) {
    alert(text);
    return;
  }
  container.textContent = '';
  const el = document.createElement('div');
  el.className = 'helper';
  if (type === 'error') el.style.color = '#a00';
  if (type === 'success') el.style.color = '#0a7';
  el.textContent = text;
  container.appendChild(el);
}

// registration export/localStorage helpers removed — Supabase will store records

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
  const current = window.location.pathname.split("/").pop() || "index.html";
  const esDialogar = current.includes('dialogar-con-el-libro');

  if (!user) {
    window.location.href = `registro.html?next=${encodeURIComponent(current)}`;
    return;
  }

  if (esDialogar && user.nivel !== 'dialogar') {
    window.location.href = `registro.html?next=${encodeURIComponent(current)}`;
    return;
  }
}

function handleRegistrationForm() {
  const form = document.querySelector("#registration-form");
  if (!form) return;
  const next = new URLSearchParams(location.search).get("next") || "dialogar-con-el-libro.html";

  const tituloEl = document.getElementById('registro-titulo');
  const subtituloEl = document.getElementById('registro-subtitulo');
  if (next.includes('dialogar-con-el-libro')) {
    if (tituloEl) tituloEl.innerHTML = 'Registro<br>Dialogar con el libro';
    if (subtituloEl) subtituloEl.textContent = 'Este registro habilita el acceso al Asistente CoopchAIn-GPT.';
  } else if (next.includes('videos')) {
    if (tituloEl) tituloEl.innerHTML = 'Registro<br>Sección Videos';
    if (subtituloEl) subtituloEl.textContent = 'Este registro habilita el acceso a los video resúmenes de cada capítulo.';
  }

  const requiereCodigo = next.includes('dialogar-con-el-libro');
  const userActual = getUser();

  if (requiereCodigo && userActual && userActual.nivel === 'videos') {
    // Usuario ya registrado en videos — solo pedir código, ocultar campos personales
    const tituloEl2 = document.getElementById('registro-titulo');
    const subtituloEl2 = document.getElementById('registro-subtitulo');
    if (tituloEl2) tituloEl2.innerHTML = 'Acceso<br>Dialogar con el libro';
    if (subtituloEl2) subtituloEl2.textContent = 'Ya estás registrado. Ingresá el código del libro para habilitar el acceso.';
    ['nombre','apellido','email','empresa','rol'].forEach(campo => {
      const el = document.getElementById(campo);
      if (el) el.closest('.form-group').style.display = 'none';
    });
    const campoCodigo = document.getElementById('campo-codigo');
    if (campoCodigo) campoCodigo.style.display = 'block';

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const d = new FormData(form);
      const codigoIngresado = (d.get('codigo') || '').toString().trim();
      if (codigoIngresado !== 'coopchAIn-24160120') {
        showMessage('Código de acceso incorrecto. Encontrás el código en la sección "Dialogar con el libro" del libro.', 'error');
        return;
      }
      setUser({ ...userActual, nivel: 'dialogar' });
      showMessage('Acceso habilitado. Redirigiendo...', 'success');
      setTimeout(() => { window.location.href = next; }, 1100);
    });
    return;
  }

  if (requiereCodigo) {
    const campoCodigo = document.getElementById('campo-codigo');
    if (campoCodigo) campoCodigo.style.display = 'block';
  }

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

    const CODIGO_VALIDO = 'coopchAIn-24160120';
    const codigoIngresado = (data.get('codigo') || '').toString().trim();
    if (requiereCodigo && codigoIngresado !== CODIGO_VALIDO) {
      showMessage('Código de acceso incorrecto. Encontrás el código en la sección "Dialogar con el libro" del libro.', 'error');
      return;
    }

    if (!payload.nombre || !payload.apellido || !payload.email) {
      alert("Completa nombre, apellido y email");
      return;
    }

    // Submit to Supabase table `Registros` using v2 client (loaded via CDN)
    const SUPABASE_URL = 'https://xiuqpxburuqqvcpyiewj.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdXFweGJ1cnVxcXZjcHlpZXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDQ1MDAsImV4cCI6MjA4ODU4MDUwMH0.-bPj4q9UaKnvJ6nOmvsaYILW0h2UW395hhRk_gs4rUo';

    if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase) {
      showMessage('Ocurrió un error. Intentá de nuevo.', 'error');
      return;
    }

    try {
      const { createClient } = supabase;
      const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

      (async () => {
        const { data, error } = await supa
          .from('Registros')
          .insert([{ nombre: payload.nombre, apellido: payload.apellido, email: payload.email, empresa: payload.empresa, cargo: payload.rol }]);

        if (error) {
          // Postgres unique_violation code is 23505
          if (error.code === '23505' || (error.details && error.details.includes('duplicate'))) {
            // Email ya existe — intentar login buscando el registro en Supabase
            const { data: existingUser, error: fetchError } = await supa
              .from('Registros')
              .select('nombre, apellido, email, empresa, cargo')
              .eq('email', payload.email)
              .single();

            if (fetchError || !existingUser) {
              showMessage('Este email ya está registrado pero no pudimos verificarlo. Intentá de nuevo.', 'error');
              return;
            }

            // Login exitoso: guardar sesión y redirigir
            const nivelLogin = next.includes('dialogar-con-el-libro') ? 'dialogar' : 'videos';
            setUser({ nombre: existingUser.nombre, apellido: existingUser.apellido, email: existingUser.email, nivel: nivelLogin });
            showMessage(`Bienvenido de nuevo, ${existingUser.nombre}. Redirigiendo...`, 'success');
            setTimeout(() => { window.location.href = next; }, 1100);
            return;
          }
          showMessage('Ocurrió un error. Intentá de nuevo.', 'error');
          return;
        }

        // success: optionally set session-like UI, then redirect
        const nivelRegistro = next.includes('dialogar-con-el-libro') ? 'dialogar' : 'videos';
        setUser({ ...payload, nivel: nivelRegistro });
        showMessage('Registro exitoso. Redirigiendo...', 'success');
        setTimeout(() => {
          if (next.includes('videos.html')) {
            window.location.href = 'suscribite.html?next=' + encodeURIComponent(next);
          } else {
            window.location.href = next;
          }
        }, 1100);
      })();
    } catch (e) {
      showMessage('Ocurrió un error. Intentá de nuevo.', 'error');
    }
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
  // Export button removed — no-op
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
