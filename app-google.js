/**
 * ═══════════════════════════════════════════════════════════════
 * CITRO — Aplicación Principal Google
 * Lógica integrada del sistema
 * ═══════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Mostrar sección específica
 */
function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar sección solicitada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Scroll al inicio
    window.scrollTo(0, 0);
}

/**
 * Volver al inicio
 */
function goToHome() {
    showSection('home');
}

// ════════════════════════════════════════════════════════════════
// SELECCIÓN Y CARGA DE FORMULARIOS
// ════════════════════════════════════════════════════════════════

/**
 * Seleccionar tipo de trámite
 */
function selectTramite(tipo) {
    if (!userState.isLoggedIn) {
        showNotification('Debes iniciar sesión primero', 'warning');
        signInWithGoogle();
        return;
    }

    if (CONFIG.options.debug) {
        console.log('📝 Seleccionando trámite:', tipo);
    }

    currentTramite = tipo;
    loadForm(tipo);
    showSection('form-section');
}

/**
 * Cargar formulario dinámicamente
 */
function loadForm(tipo) {
    const formConfig = FORMS_CONFIG[tipo];
    
    if (!formConfig) {
        showNotification('Formulario no encontrado', 'error');
        return;
    }

    const formContainer = document.getElementById('dynamic-form');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');

    // Actualizar títulos
    formTitle.textContent = formConfig.title;
    formSubtitle.textContent = formConfig.subtitle;

    // Generar campos del formulario
    let formHTML = '<div class="form-grid">';

    formConfig.fields.forEach(field => {
        formHTML += generateFieldHTML(field);
    });

    formHTML += '</div>';
    formContainer.innerHTML = formHTML;
}

/**
 * Generar HTML para un campo
 */
function generateFieldHTML(field) {
    const required = field.required ? 'required' : '';
    const requiredStar = field.required ? '<span style="color: #d32f2f;">*</span>' : '';
    
    let html = `
        <div class="form-field">
            <label for="${field.name}">
                ${field.label} ${requiredStar}
            </label>
    `;

    switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
        case 'date':
            html += `
                <input 
                    type="${field.type}" 
                    id="${field.name}" 
                    name="${field.name}"
                    placeholder="${field.placeholder || ''}"
                    ${required}
                    ${field.type === 'number' && field.min ? `min="${field.min}"` : ''}
                    ${field.type === 'number' && field.max ? `max="${field.max}"` : ''}
                >
            `;
            break;

        case 'select':
            html += `<select id="${field.name}" name="${field.name}" ${required}>`;
            html += '<option value="">Seleccione una opción</option>';
            field.options.forEach(option => {
                html += `<option value="${option}">${option}</option>`;
            });
            html += '</select>';
            break;

        case 'textarea':
            html += `
                <textarea 
                    id="${field.name}" 
                    name="${field.name}"
                    rows="4"
                    placeholder="${field.placeholder || ''}"
                    ${required}
                ></textarea>
            `;
            break;
    }

    if (field.help) {
        html += `<small class="help-text">${field.help}</small>`;
    }

    html += '</div>';
    return html;
}

// ════════════════════════════════════════════════════════════════
// ENVÍO DE SOLICITUD
// ════════════════════════════════════════════════════════════════

/**
 * Enviar solicitud completa
 */
async function enviarSolicitud() {
    try {
        if (!userState.isLoggedIn) {
            showNotification('Debes iniciar sesión', 'error');
            return;
        }

        // Validar formulario
        const formData = getFormData();
        if (!validateForm(formData)) {
            return;
        }

        // Mostrar loading
        showLoading(true);
        const btnEnviar = document.getElementById('btn-enviar-solicitud');
        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.textContent = 'Procesando...';
        }

        if (CONFIG.options.debug) {
            console.log('🚀 Iniciando envío de solicitud...');
            console.log('Tipo:', currentTramite);
        }

        // PASO 1: Generar folio
        const folio = generateFolio(currentTramite);
        
        // PASO 2: Generar PDF
        showNotification('Generando PDF...', 'info');
        const pdfBlob = await generatePDF(formData, folio, currentTramite);

        // PASO 3: Subir PDF a Drive
        showNotification('Subiendo PDF a Google Drive...', 'info');
        const driveFile = await uploadPDFToDrive(pdfBlob, folio, currentTramite);

        // PASO 4: Guardar en Sheets
        showNotification('Guardando datos...', 'info');
        const solicitudData = {
            folio,
            tipo: currentTramite,
            formData,
            pdfUrl: driveFile.webViewLink,
            driveFileId: driveFile.fileId
        };
        
        await createSolicitudEnSheets(solicitudData);

        // PASO 5: Enviar emails
        showNotification('Enviando notificaciones...', 'info');
        await Promise.all([
            sendConfirmacionEmail(solicitudData),
            sendNotificacionCT(solicitudData)
        ]);

        // Éxito
        showLoading(false);
        mostrarExito(folio, driveFile.webViewLink);

    } catch (error) {
        console.error('❌ Error al enviar solicitud:', error);
        showLoading(false);
        showNotification('Error al enviar solicitud: ' + error.message, 'error');
        
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar Solicitud';
        }
    }
}

/**
 * Obtener datos del formulario
 */
function getFormData() {
    const formConfig = FORMS_CONFIG[currentTramite];
    const data = {};

    formConfig.fields.forEach(field => {
        const element = document.getElementById(field.name);
        if (element) {
            data[field.name] = element.value;
        }
    });

    return data;
}

/**
 * Validar formulario
 */
function validateForm(formData) {
    const formConfig = FORMS_CONFIG[currentTramite];
    
    for (const field of formConfig.fields) {
        if (field.required && !formData[field.name]) {
            showNotification(`El campo "${field.label}" es obligatorio`, 'warning');
            document.getElementById(field.name)?.focus();
            return false;
        }

        // Validar email
        if (field.type === 'email' && formData[field.name]) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData[field.name])) {
                showNotification('Email no válido', 'warning');
                document.getElementById(field.name)?.focus();
                return false;
            }
        }

        // Validar números
        if (field.type === 'number' && formData[field.name]) {
            const num = parseFloat(formData[field.name]);
            if (field.min && num < field.min) {
                showNotification(`${field.label} debe ser mayor a ${field.min}`, 'warning');
                return false;
            }
            if (field.max && num > field.max) {
                showNotification(`${field.label} debe ser menor a ${field.max}`, 'warning');
                return false;
            }
        }
    }

    return true;
}

/**
 * Generar folio único
 */
function generateFolio(tipo) {
    const prefix = CONFIG.formularios.formatoFolio[tipo] || 'SOL';
    const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .replace('T', '-')
        .split('.')[0];
    
    return `${prefix}-${timestamp}`;
}

/**
 * Mostrar pantalla de éxito
 */
function mostrarExito(folio, pdfUrl) {
    const formSection = document.getElementById('form-section');
    if (!formSection) return;

    formSection.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto; text-align: center; padding: 60px 20px;">
            <div style="width: 80px; height: 80px; background: #34a853; border-radius: 50%; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            
            <h2 style="color: #34a853; font-size: 32px; margin: 0 0 20px;">¡Solicitud Enviada!</h2>
            
            <div style="background: #e8f5e9; padding: 30px; border-radius: 12px; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #666; font-size: 14px;">Su folio es:</p>
                <p style="margin: 0; font-size: 28px; font-weight: 700; color: #1e8e3e; font-family: monospace;">${folio}</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Su solicitud ha sido registrada exitosamente.<br>
                Recibirá un email de confirmación en breve.
            </p>
            
            <div style="margin: 30px 0; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="${pdfUrl}" target="_blank" class="btn btn-primary">
                    📄 Ver PDF
                </a>
                <button onclick="goToHome()" class="btn btn-secondary">
                    🏠 Ir al Inicio
                </button>
            </div>
        </div>
    `;

    showNotification('¡Solicitud enviada exitosamente!', 'success');
}

// ════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════

/**
 * Mostrar/ocultar loading
 */
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications-container') || createNotificationsContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span style="font-size: 20px; margin-right: 10px;">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * Crear contenedor de notificaciones
 */
function createNotificationsContainer() {
    const container = document.createElement('div');
    container.id = 'notifications-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
}

// Variable global para el tipo de trámite actual
let currentTramite = null;

// ════════════════════════════════════════════════════════════════
// LOG
// ════════════════════════════════════════════════════════════════

if (CONFIG?.options?.debug) {
    console.log('📦 app-google.js cargado');
}
