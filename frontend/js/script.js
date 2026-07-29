const API_BASE = 'http://127.0.0.1:5000/api';

const btn = document.getElementById("btn");
const originalBtnText = btn.textContent;

btn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) return;

    btn.disabled = true;
    btn.textContent = "Connexion en cours...";

    fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
        .then(response => response.json())
        .then(data => {
            btn.disabled = false;

            if (data.success) {
                // Keep the logged-in user around so ticket.html can attach user_id
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                window.location.href = "list.html"; // pages/list.html, same folder as login.html
            } else {
                btn.classList.add("btn-error");
                btn.textContent = data.error || "Informations incorrectes";
            }
        })
        .catch(() => {
            btn.disabled = false;
            btn.classList.add("btn-error");
            btn.textContent = "Erreur de connexion au serveur";
        });
});

["email", "password"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
        btn.classList.remove("btn-error");
        btn.textContent = originalBtnText;
    });
});
