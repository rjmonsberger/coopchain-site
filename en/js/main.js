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
  el.innerHTML = text;
  container.appendChild(el);
}

function refreshAuthUI() {
  const user = getUser();

  document.querySelectorAll("[data-auth-label]").forEach(el => {
    el.textContent = user ? `Hi, ${user.nombre}` : "Sign in / Register";
  });

  document.querySelectorAll("[data-requires-auth]").forEach(el => {
    const directHref = el.getAttribute("href");
    if (!user && directHref && !directHref.includes("register.html")) {
      el.setAttribute("data-target", directHref);
      el.setAttribute("href", `register.html?next=${encodeURIComponent(directHref)}`);
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
  const isDialogar = current.includes('talk-to-the-book');
  if (!user) {
    window.location.href = `register.html?next=${encodeURIComponent(current)}`;
    return;
  }

  if (isDialogar && user.nivel !== 'dialogar') {
    window.location.href = `register.html?next=${encodeURIComponent(current)}`;
    return;
  }

  const isVideos = current.includes('videos');

  if (isVideos) {
    const user = getUser();
    const alreadySubscribed = user && user.suscripto === true;
    if (!alreadySubscribed) {
      window.location.href = 'subscribe.html?next=' + encodeURIComponent(current);
      return;
    }
  }
}

function handleRegistrationForm() {
  const form = document.querySelector("#registration-form");
  if (!form) return;
  const next = new URLSearchParams(location.search).get("next") || "talk-to-the-book.html";

  const tituloEl = document.getElementById('registro-titulo');
  const subtituloEl = document.getElementById('registro-subtitulo');
  if (next.includes('talk-to-the-book')) {
    if (tituloEl) tituloEl.innerHTML = 'Register<br>Talk to the Book';
    if (subtituloEl) subtituloEl.textContent = 'This registration enables access to the CoopchAIn-GPT Assistant.';
  } else if (next.includes('videos')) {
    if (tituloEl) tituloEl.innerHTML = 'Register<br>Videos Section';
    if (subtituloEl) subtituloEl.textContent = 'This registration enables access to the chapter video summaries.';
  }

  const requiresCode = next.includes('talk-to-the-book');
  const userActual = getUser();

  if (requiresCode && userActual && userActual.nivel === 'videos') {
    const tituloEl2 = document.getElementById('registro-titulo');
    const subtituloEl2 = document.getElementById('registro-subtitulo');
    if (tituloEl2) tituloEl2.innerHTML = 'Access<br>Talk to the Book';
    if (subtituloEl2) subtituloEl2.textContent = 'You are already registered. Enter the book code to enable access.';
    ['nombre','apellido','email','empresa','rol'].forEach(campo => {
      const el = document.getElementById(campo);
      if (el) {
        el.removeAttribute('required');
        el.closest('.form-group').style.display = 'none';
      }
    });
    const campoCodigo = document.getElementById('campo-codigo');
    if (campoCodigo) campoCodigo.style.display = 'block';

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = new FormData(form);
      const codigoIngresado = (d.get('codigo') || '').toString().trim();
      if (codigoIngresado !== 'coopchAIn-1624') {
        showMessage('Incorrect access code. You can find the code in the "Talk to the Book" section of the book. If you don\'t have the book, you can purchase it on <a href="https://amazon.com" target="_blank" rel="noopener" style="color:#cc0000;font-weight:700;">Amazon</a>.', 'error');
        return;
      }
      const SUPABASE_URL = 'https://xiuqpxburuqqvcpyiewj.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdXFweGJ1cnVxcXZjcHlpZXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDQ1MDAsImV4cCI6MjA4ODU4MDUwMH0.-bPj4q9UaKnvJ6nOmvsaYILW0h2UW395hhRk_gs4rUo';
      const supaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error: updateError } = await supaClient
        .from('Registros')
        .update({ evento: 'ambas' })
        .eq('email', userActual.email);

      if (updateError) {
        console.error('Error updating evento to ambas:', updateError.message);
      }
      setUser({ ...userActual, nivel: 'dialogar' });
      showMessage('Access enabled. Redirecting...', 'success');
      setTimeout(() => { window.location.href = next; }, 1100);
    });
    return;
  }

  if (requiresCode) {
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

    const CODIGO_VALIDO = 'coopchAIn-1624';
    const codigoIngresado = (data.get('codigo') || '').toString().trim();
    if (requiresCode && codigoIngresado !== CODIGO_VALIDO) {
      showMessage('Incorrect access code. You can find the code in the "Talk to the Book" section of the book. If you don\'t have the book, you can purchase it on <a href="https://amazon.com" target="_blank" rel="noopener" style="color:#cc0000;font-weight:700;">Amazon</a>.', 'error');
      return;
    }

    if (!payload.nombre || !payload.apellido || !payload.email) {
      alert("Please fill in first name, last name and email");
      return;
    }

    const SUPABASE_URL = 'https://xiuqpxburuqqvcpyiewj.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdXFweGJ1cnVxcXZjcHlpZXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDQ1MDAsImV4cCI6MjA4ODU4MDUwMH0.-bPj4q9UaKnvJ6nOmvsaYILW0h2UW395hhRk_gs4rUo';

    if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase) {
      showMessage('An error occurred. Please try again.', 'error');
      return;
    }

    try {
      const { createClient } = supabase;
      const supa = createClient(SUPABASE_URL, SUPABASE_KEY);

      (async () => {
        const { data, error } = await supa
          .from('Registros')
          .insert([{ nombre: payload.nombre, apellido: payload.apellido, email: payload.email, empresa: payload.empresa, cargo: payload.rol, evento: next.includes('talk-to-the-book') ? 'dialogar_con_el_libro' : 'seccion_videos' }]);

        if (error) {
          if (error.code === '23505' || (error.details && error.details.includes('duplicate'))) {
            const { data: existingUser, error: fetchError } = await supa
              .from('Registros')
              .select('nombre, apellido, email, empresa, cargo')
              .eq('email', payload.email)
              .single();

            if (fetchError || !existingUser) {
              showMessage('This email is already registered but we could not verify it. Please try again.', 'error');
              return;
            }

            const nivelLogin = next.includes('talk-to-the-book') ? 'dialogar' : 'videos';
            setUser({ nombre: existingUser.nombre, apellido: existingUser.apellido, email: existingUser.email, nivel: nivelLogin });
            showMessage(`Welcome back, ${existingUser.nombre}. Redirecting...`, 'success');
            setTimeout(() => { window.location.href = next; }, 1100);
            return;
          }
          showMessage('An error occurred. Please try again.', 'error');
          return;
        }

        const nivelRegistro = next.includes('talk-to-the-book') ? 'dialogar' : 'videos';
        setUser({ ...payload, nivel: nivelRegistro });
        showMessage('Registration successful. Redirecting...', 'success');
        setTimeout(() => {
          const nivelActual = next.includes('talk-to-the-book') ? 'dialogar' : 'videos';
          const yaVioSuscripcion = localStorage.getItem('coopchain_suscripcion') === 'true';
          if (nivelActual === 'videos' && !yaVioSuscripcion) {
            window.location.href = 'subscribe.html?next=' + encodeURIComponent(next);
          } else {
            window.location.href = next;
          }
        }, 1100);
      })();
    } catch (e) {
      showMessage('An error occurred. Please try again.', 'error');
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
  bindLogout();
});
