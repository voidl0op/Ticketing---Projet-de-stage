const API_BASE = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {

  const tbody = document.getElementById('tickets-body');

  // Map backend values (French) to the CSS classes defined in list.css
  const priorityClass = {
    informationelle: 'low',
    haute: 'high',
    critique: 'crit'
  };

  const priorityLabel = {
    informationelle: 'Informationelle',
    haute: 'Haute',
    critique: 'Critique'
  };

  const statusClass = {
    nouveau: 'open',
    'en cours': 'progress',
    'résolu': 'resolved',
    'cloturé': 'resolved'
  };

  const statusLabel = {
    nouveau: 'Ouvert',
    'en cours': 'En cours',
    'résolu': 'Résolu',
    'cloturé': 'Clôturé'
  };

  function formatDate(isoString) {
    const d = new Date(isoString);
    if (isNaN(d)) return isoString;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderRow(ticket) {
    const tr = document.createElement('tr');

    const pClass = priorityClass[ticket.priorite] || 'low';
    const pLabel = priorityLabel[ticket.priorite] || ticket.priorite;
    const sClass = statusClass[ticket.statut] || 'open';
    const sLabel = statusLabel[ticket.statut] || ticket.statut;

    tr.innerHTML = `
      <td class="cell-title">${escapeHtml(ticket.titre)}</td>
      <td>${escapeHtml(ticket.categorie)}</td>
      <td><span class="priority-pill ${pClass}">${escapeHtml(pLabel)}</span></td>
      <td><span class="status-pill ${sClass}">${escapeHtml(sLabel)}</span></td>
      <td>${formatDate(ticket.created_at)}</td>
    `;
    return tr;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function loadTickets() {
    fetch(`${API_BASE}/tickets`)
      .then(response => response.json())
      .then(tickets => {
        tbody.innerHTML = '';
        if (!Array.isArray(tickets) || tickets.length === 0) {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td colspan="5" style="text-align:center; color: var(--ink-500);">Aucun ticket pour le moment.</td>`;
          tbody.appendChild(tr);
          return;
        }
        tickets.forEach(ticket => tbody.appendChild(renderRow(ticket)));
      })
      .catch(() => {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--critical);">Impossible de charger les tickets.</td></tr>`;
      });
  }

  loadTickets();
});