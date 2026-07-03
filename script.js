// If the page is opened directly from disk (file://) instead of served by
// the backend, point API calls at a locally running server on port 3000.
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

/* ---------------- Fire status ---------------- */
async function loadStatus() {
  const dot = document.getElementById('emberDot');
  const text = document.getElementById('fireStatusText');
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();
    text.textContent = data.message;
    dot.classList.toggle('lit', !!data.lit);
  } catch (err) {
    text.textContent = 'Tue–Sun, 5:00 PM – 11:00 PM';
    dot.classList.remove('lit');
  }
}

/* ---------------- Menu ---------------- */
let fullMenu = [];
let activeCategory = 'All';

function renderTabs(categories) {
  const tabWrap = document.getElementById('menuTabs');
  tabWrap.innerHTML = '';
  const allCats = ['All', ...categories];

  allCats.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-tab' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === activeCategory ? 'true' : 'false');
    btn.addEventListener('click', () => {
      activeCategory = cat;
      renderTabs(categories);
      renderMenuItems();
    });
    tabWrap.appendChild(btn);
  });
}

function renderMenuItems() {
  const list = document.getElementById('menuList');
  const items =
    activeCategory === 'All'
      ? fullMenu
      : fullMenu.filter((item) => item.category === activeCategory);

  if (items.length === 0) {
    list.innerHTML = '<p class="menu-error">No dishes in this category right now.</p>';
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <div class="menu-item">
        <div>
          <div class="menu-item-name">${escapeHTML(item.name)}</div>
          <div class="menu-item-desc">${escapeHTML(item.description)}</div>
          ${
            item.tags && item.tags.length
              ? `<div class="menu-item-tags">${item.tags
                  .map((t) => `<span class="tag">${escapeHTML(t)}</span>`)
                  .join('')}</div>`
              : ''
          }
        </div>
        <div class="menu-item-price">$${item.price}</div>
      </div>`
    )
    .join('');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadMenu() {
  const list = document.getElementById('menuList');
  try {
    const res = await fetch(`${API_BASE}/api/menu`);
    if (!res.ok) throw new Error('Menu request failed');
    fullMenu = await res.json();
    const categories = [...new Set(fullMenu.map((item) => item.category))];
    renderTabs(categories);
    renderMenuItems();
  } catch (err) {
    list.innerHTML =
      '<p class="menu-error">Could not load the menu right now. Please make sure the backend server is running.</p>';
  }
}

/* ---------------- Reservation form ---------------- */
function setStatus(el, message, type) {
  el.textContent = message;
  el.className = 'form-status' + (type ? ' ' + type : '');
}

function initReserveForm() {
  const form = document.getElementById('reserveForm');
  const statusEl = document.getElementById('reserveStatus');
  const submitBtn = document.getElementById('reserveSubmit');

  // Prevent picking a date in the past.
  const dateInput = document.getElementById('date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(statusEl, '', '');

    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      date: form.date.value,
      time: form.time.value,
      guests: form.guests.value,
      notes: form.notes.value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(`${API_BASE}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error((data.errors && data.errors.join(' ')) || 'Something went wrong.');
      }

      setStatus(statusEl, data.message, 'success');
      form.reset();
      dateInput.setAttribute('min', today);
    } catch (err) {
      setStatus(statusEl, err.message || 'Could not submit reservation.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request table';
    }
  });
}

/* ---------------- Contact form ---------------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('contactStatus');
  const submitBtn = document.getElementById('contactSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(statusEl, '', '');

    const payload = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error((data.errors && data.errors.join(' ')) || 'Something went wrong.');
      }

      setStatus(statusEl, data.message, 'success');
      form.reset();
    } catch (err) {
      setStatus(statusEl, err.message || 'Could not send message.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
}

/* ---------------- Init ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  loadStatus();
  loadMenu();
  initReserveForm();
  initContactForm();
});
