const API_BASE = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {

  const tbody = document.getElementById('tickets-body');

  function getCurrentUserId() {
    try {
      const raw = localStorage.getItem('currentUser');
      const user = raw ? JSON.parse(raw) : null;
      return user ? user.user_id : null;
    } catch (e) {
      return null;
    }
  }

  // If there's no logged-in user, don't silently show an empty list —
  // send them back to login instead.
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
    tr.className = 'ticket-row';

    const pClass = priorityClass[ticket.priorite] || 'low';
    const pLabel = priorityLabel[ticket.priorite] || ticket.priorite;
    const sClass = statusClass[ticket.statut] || 'open';
    const sLabel = statusLabel[ticket.statut] || ticket.statut;

    tr.innerHTML = `
      <td class="cell-title">
        <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
        ${escapeHtml(ticket.titre)}
      </td>
      <td>${escapeHtml(ticket.categorie)}</td>
      <td><span class="priority-pill ${pClass}">${escapeHtml(pLabel)}</span></td>
      <td><span class="status-pill ${sClass}">${escapeHtml(sLabel)}</span></td>
      <td>${formatDate(ticket.created_at)}</td>
    `;

    // Detail row stays permanently in the DOM as a table-row (so the CSS
    // max-height transition below can animate) — an inner wrapper div is
    // what actually collapses/expands.
    const detailTr = document.createElement('tr');
    detailTr.className = 'ticket-detail-row';
    const detailTd = document.createElement('td');
    detailTd.colSpan = 5;
    detailTd.innerHTML = '<div class="ticket-detail-wrapper"><div class="ticket-detail-loading">Chargement...</div></div>';
    detailTr.appendChild(detailTd);
    const wrapper = detailTd.querySelector('.ticket-detail-wrapper');

    let loaded = false;

    tr.addEventListener('click', () => {
      const isOpen = tr.classList.contains('expanded');

      // Collapse any other open row so only one is expanded at a time
      document.querySelectorAll('.ticket-detail-wrapper.open').forEach(el => {
        el.classList.remove('open');
        el.style.maxHeight = '0px';
      });
      document.querySelectorAll('.ticket-row.expanded').forEach(el => { el.classList.remove('expanded'); });

      if (isOpen) return; // already collapsed by the lines above

      wrapper.classList.add('open');
      tr.classList.add('expanded');
      wrapper.style.maxHeight = wrapper.scrollHeight + 'px';

      if (!loaded) {
        loaded = true;
        fetch(`${API_BASE}/tickets/${ticket.ticket_id}`)
          .then(res => res.json())
          .then(detail => {
            wrapper.innerHTML = renderDetail(detail);
            // Content just changed size (was the "Chargement..." placeholder) — resize to fit.
            wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
          })
          .catch(() => {
            wrapper.innerHTML = '<div class="ticket-detail-error">Impossible de charger les détails.</div>';
            wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
          });
      }
    });

    return [tr, detailTr];
  }

  function renderDetail(ticket) {
    const attachmentsHtml = (ticket.attachments && ticket.attachments.length > 0)
      ? ticket.attachments.map(att => `
          <a class="attachment-chip" href="${API_BASE}/attachments/${att.attachment_id}" target="_blank" rel="noopener">
            ${fileIconSvg(att.mime_type)}
            <span class="attachment-name">${escapeHtml(att.original_name)}</span>
            <span class="attachment-size">${formatFileSize(att.file_size)}</span>
            <svg class="attachment-download" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
          </a>
        `).join('')
      : '<span class="no-attachments">Aucune pièce jointe.</span>';

    const description = escapeHtml(ticket.description_ticket).replace(/\n/g, '<br>');

    return `
      <div class="ticket-detail">
        <div class="ticket-detail-block">
          <p class="ticket-detail-label">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Description
          </p>
          <p class="ticket-detail-description">${description}</p>
        </div>
        <div class="ticket-detail-block">
          <p class="ticket-detail-label">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48" />
            </svg>
            Pièces jointes
          </p>
          <div class="ticket-detail-attachments">${attachmentsHtml}</div>
        </div>
      </div>
    `;
  }

  function fileIconSvg(mimeType) {
    if (mimeType && mimeType.startsWith('image/')) {
      return `<svg class="attachment-icon" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>`;
    }
    return `<svg class="attachment-icon" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>`;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function loadTickets() {
    const userId = getCurrentUserId();
    fetch(`${API_BASE}/tickets?user_id=${userId}`)
      .then(response => response.json())
      .then(tickets => {
        tbody.innerHTML = '';
        if (!Array.isArray(tickets) || tickets.length === 0) {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td colspan="5" style="text-align:center; color: var(--ink-500);">Aucun ticket pour le moment.</td>`;
          tbody.appendChild(tr);
          return;
        }
        tickets.forEach(ticket => {
          const [tr, detailTr] = renderRow(ticket);
          tbody.appendChild(tr);
          tbody.appendChild(detailTr);
        });
      })
      .catch(() => {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--critical);">Impossible de charger les tickets.</td></tr>`;
      });
  }

  loadTickets();
});