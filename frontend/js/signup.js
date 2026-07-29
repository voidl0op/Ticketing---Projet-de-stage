const API_BASE = 'http://127.0.0.1:5000/api';

const btn = document.getElementById('btn');
const passwordLabel = document.getElementById('password-label');
const confirmPasswordLabel = document.getElementById('confirmPassword-label');

const PASSWORD_LABEL_TEXT = 'Mot de passe';
const CONFIRM_PASSWORD_LABEL_TEXT = 'Confirmer le mot de passe';

btn.addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    passwordLabel.textContent = 'Les mots de passe ne correspondent pas';
    confirmPasswordLabel.textContent = 'Les mots de passe ne correspondent pas';
    passwordLabel.classList.add('label-error');
    confirmPasswordLabel.classList.add('label-error');
    return;
  }

  passwordLabel.textContent = PASSWORD_LABEL_TEXT;
  confirmPasswordLabel.textContent = CONFIRM_PASSWORD_LABEL_TEXT;
  passwordLabel.classList.remove('label-error');
  confirmPasswordLabel.classList.remove('label-error');

  fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      user_email: email,
      user_password: password
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // index.html (this page) is now at the project root, login now lives in pages/
        window.location.href = 'pages/login.html';
      } else {
        alert(data.error || "Erreur lors de l'inscription.");
      }
    });
});
