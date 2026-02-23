// ════════════════════════════════════════════════════════════════
// DASHBOARD Y PANEL DE SOLICITUDES (NUEVO)
// ════════════════════════════════════════════════════════════════

async function showDashboard() {
    if (!userState.isLoggedIn) {
        showNotification('Debes iniciar sesión para ver el Dashboard', 'warning');
        return;
    }
    showSection('dashboard-section');
    await loadDashboardData();
}

async function loadDashboardData() {
    showLoading(true);
    try {
        const solicitudes = userState.isAdmin ? 
            await getAllSolicitudes() : 
            await getSolicitudesUsuario();

        renderDashboardStats(solicitudes);
        renderSolicitudesTable(solicitudes);
    } catch (error) {
        console.error("Error cargando dashboard:", error);
        showNotification('Error al cargar datos del servidor', 'error');
    } finally {
        showLoading(false);
    }
}

function renderDashboardStats(solicitudes) {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.Estado.toLowerCase() === 'pendiente').length;
    const aprobadas = solicitudes.filter(s => s.Estado.toLowerCase() === 'aprobada').length;

    document.getElementById('dashboard-stats').innerHTML = `
        <div class="card" style="text-align: center; border-bottom: 4px solid var(--google-blue);">
            <h2 style="font-size: 36px; color: var(--text-primary); margin-bottom: 5px;">${total}</h2>
            <p style="font-weight: 500;">Total Solicitudes</p>
        </div>
        <div class="card" style="text-align: center; border-bottom: 4px solid var(--google-yellow);">
            <h2 style="font-size: 36px; color: var(--google-yellow); margin-bottom: 5px;">${pendientes}</h2>
            <p style="font-weight: 500;">Pendientes de Revisión</p>
        </div>
        <div class="card" style="text-align: center; border-bottom: 4px solid var(--google-green);">
            <h2 style="font-size: 36px; color: var(--google-green); margin-bottom: 5px;">${aprobadas}</h2>
            <p style="font-weight: 500;">Aprobadas</p>
        </div>
    `;
}

function renderSolicitudesTable(solicitudes) {
    const tbody = document.getElementById('solicitudes-body');
    tbody.innerHTML = '';

    if (solicitudes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-secondary);">No hay solicitudes registradas aún.</td></tr>';
        return;
    }

    solicitudes.sort((a, b) => new Date(b.FechaSolicitud) - new Date(a.FechaSolicitud));

    solicitudes.forEach(s => {
        const fecha = new Date(s.FechaSolicitud).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
        
        let colorEstado = '#fbbc04'; 
        if (s.Estado.toLowerCase() === 'aprobada') colorEstado = '#34a853'; 
        if (s.Estado.toLowerCase() === 'rechazada') colorEstado = '#ea4335'; 

        const nombreTramite = s.TipoTramite.replace(/_/g, ' ').toUpperCase();

        let acciones = `<a href="${s.URLPdf}" target="_blank" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">📄 Ver PDF</a>`;
        
        // Administrador puede aprobar y rechazar desde aquí
        if (userState.isAdmin && s.Estado.toLowerCase() === 'pendiente') {
            acciones += `
                <button onclick="cambiarEstadoDashboard('${s.rowNumber}', 'Aprobada')" class="btn" style="background:#e6f4ea; color:#137333; padding: 6px 12px; font-size: 13px; margin-left:5px;">✓ Aprobar</button>
                <button onclick="cambiarEstadoDashboard('${s.rowNumber}', 'Rechazada')" class="btn" style="background:#fce8e6; color:#c5221f; padding: 6px 12px; font-size: 13px; margin-left:5px;">✕ Rechazar</button>
            `;
        }

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #dadce0;">
                <td style="padding: 12px; font-family: monospace; font-weight: 500;">${s.Folio}</td>
                <td style="padding: 12px;">${fecha}</td>
                <td style="padding: 12px; font-size: 14px;">${nombreTramite}</td>
                <td style="padding: 12px;">
                    <div style="font-weight: 500;">${s.NombreSolicitante}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${s.EmailSolicitante}</div>
                </td>
                <td style="padding: 12px;">
                    <span style="background: ${colorEstado}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                        ${s.Estado}
                    </span>
                </td>
                <td style="padding: 12px; white-space: nowrap;">${acciones}</td>
            </tr>
        `;
    });
}

async function cambiarEstadoDashboard(rowNumber, nuevoEstado) {
    if (!confirm(`¿Estás seguro de marcar esta solicitud como ${nuevoEstado}?`)) return;

    showLoading(true);
    try {
        await updateSolicitudEstado(rowNumber, nuevoEstado, 'Actualizado vía Dashboard CITRO');
        showNotification(`Solicitud marcada como ${nuevoEstado}`, 'success');
        await loadDashboardData(); // Recarga la tabla para ver el cambio
    } catch (error) {
        showNotification('Error al actualizar estado', 'error');
    } finally {
        showLoading(false);
    }
}
