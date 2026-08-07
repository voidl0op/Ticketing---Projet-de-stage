const API_BASE = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {

  function getCurrentUserId() {
    try {
      const raw = localStorage.getItem('currentUser');
      const user = raw ? JSON.parse(raw) : null;
      return user ? user.user_id : null;
    } catch (e) {
      return null;
    }
  }

  if (!getCurrentUserId()) {
    window.location.href = 'login.html';
    return;
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }

  /* ---------- Select placeholder styling ---------- */
  const selects = document.querySelectorAll('select.text-input');
  selects.forEach((select) => {
    const syncPlaceholderState = () => {
      select.classList.toggle('placeholder-state', select.value === '');
    };
    syncPlaceholderState();
    select.addEventListener('change', syncPlaceholderState);
  });

  /* ---------- File attachment cards (screenshot / log) ---------- */
  const attachConfigs = [
    { cardId: 'screenshot-card', inputId: 'screenshot-input', accept: '.png,.jpg,.jpeg,.gif' },
    { cardId: 'log-card', inputId: 'log-input', accept: '.txt,.log,.zip' }
  ];

  attachConfigs.forEach(({ cardId, inputId }) => {
    const card = document.getElementById(cardId);
    const input = document.getElementById(inputId);
    const browseBtn = card ? card.querySelector('.browse-link') : null;
    const filenameEl = card ? card.querySelector('.attach-filename') : null;

    if (!card || !input || !browseBtn) return;

    browseBtn.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
      if (input.files && input.files.length > 0) {
        showFilename(input.files[0].name);
      }
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach((evt) => {
      card.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.add('drag-over');
      });
    });

    ['dragleave', 'dragend'].forEach((evt) => {
      card.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        card.classList.remove('drag-over');
      });
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        input.files = files;
        showFilename(files[0].name);
      }
    });

    function showFilename(name) {
      if (filenameEl) {
        filenameEl.textContent = name;
        filenameEl.style.display = 'block';
      }
    }
  });

  /* ---------- Form validation + submit ---------- */
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const categorySelect = document.getElementById('category');
  const prioritySelect = document.getElementById('priority');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const toast = document.getElementById('toast');

  const requiredFields = [
    { el: titleInput, errorId: 'title-error' },
    { el: descriptionInput, errorId: 'description-error' },
    { el: categorySelect, errorId: 'category-error' },
    { el: prioritySelect, errorId: 'priority-error' }
  ];

  function clearError(field) {
    field.el.classList.remove('field-error');
    const errorEl = document.getElementById(field.errorId);
    if (errorEl) errorEl.classList.remove('visible');
  }

  function setError(field) {
    field.el.classList.add('field-error');
    const errorEl = document.getElementById(field.errorId);
    if (errorEl) errorEl.classList.add('visible');
  }

  requiredFields.forEach((field) => {
    const evt = field.el.tagName === 'SELECT' ? 'change' : 'input';
    field.el.addEventListener(evt, () => {
      if (field.el.value.trim() !== '') clearError(field);
    });
  });

  function validateForm() {
    let isValid = true;
    requiredFields.forEach((field) => {
      if (field.el.value.trim() === '') {
        setError(field);
        isValid = false;
      } else {
        clearError(field);
      }
    });
    return isValid;
  }

  function showToast(message) {
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function submitTicket() {
    const formData = new FormData();
    formData.append('title', titleInput.value.trim());
    formData.append('description', descriptionInput.value.trim());
    formData.append('category', categorySelect.value);
    formData.append('priority', prioritySelect.value);
    formData.append('user_id', getCurrentUserId());

    const screenshotInput = document.getElementById('screenshot-input');
    const logInput = document.getElementById('log-input');
    if (screenshotInput && screenshotInput.files[0]) {
      formData.append('screenshot', screenshotInput.files[0]);
    }
    if (logInput && logInput.files[0]) {
      formData.append('log', logInput.files[0]);
    }

    return fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      body: formData
      // No Content-Type header here — the browser sets the multipart
      // boundary automatically when the body is a FormData object.
    }).then(response => response.json());
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (!validateForm()) {
        const firstInvalid = requiredFields.find((f) => f.el.value.trim() === '');
        if (firstInvalid) firstInvalid.el.focus();
        return;
      }

      const originalContent = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';

      submitTicket()
        .then((data) => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
          if (data.success) {
            showToast('Ticket soumis avec succès.');
            resetForm();
          } else {
            showToast(data.error || "Erreur lors de la création du ticket.");
          }
        })
        .catch(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
          showToast('Erreur de connexion au serveur.');
        });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetForm();
    });
  }

  function resetForm() {
    titleInput.value = '';
    descriptionInput.value = '';
    categorySelect.value = '';
    prioritySelect.value = '';
    selects.forEach((s) => s.classList.add('placeholder-state'));
    requiredFields.forEach(clearError);

    attachConfigs.forEach(({ cardId, inputId }) => {
      const card = document.getElementById(cardId);
      const input = document.getElementById(inputId);
      const filenameEl = card ? card.querySelector('.attach-filename') : null;
      if (input) input.value = '';
      if (filenameEl) {
        filenameEl.textContent = '';
        filenameEl.style.display = 'none';
      }
    });
  }
});