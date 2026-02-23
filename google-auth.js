/**
 * ═══════════════════════════════════════════════════════════════
 * CITRO — Autenticación Google OAuth 2.0
 * Login con Google (@uv.mx)
 * ═══════════════════════════════════════════════════════════════
 */

// Estado global del usuario
const userState = {
    isLoggedIn: false,
    isAdmin: false,
    profile: {
        email: '',
        nombre: '',
        foto: '',
        googleId: ''
    },
    tokenClient: null,
    accessToken: null
};

// ════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════════════

/**
 * Cargar Google API
 */
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            gapi.load('client', () => {
                initGoogleClient().then(resolve).catch(reject);
            });
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Cargar Google Identity Services
 */
function loadGoogleIdentity() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Inicializar Google API Client
 */
async function initGoogleClient() {
    try {
        await gapi.client.init({
            apiKey: CONFIG.google.apiKey,
            discoveryDocs: CONFIG.google.discoveryDocs
        });

        if (CONFIG.options.debug) {
            console.log('✅ Google API Client inicializado');
        }
    } catch (error) {
        console.error('❌ Error al inicializar Google API:', error);
        throw error;
    }
}

/**
 * Inicializar Token Client (OAuth 2.0)
 */
function initTokenClient() {
    userState.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.google.clientId,
        scope: CONFIG.google.scopes.join(' '),
        callback: handleAuthCallback
    });

    if (CONFIG.options.debug) {
        console.log('✅ Token Client inicializado');
    }
}

// ════════════════════════════════════════════════════════════════
// LOGIN Y LOGOUT
// ════════════════════════════════════════════════════════════════

/**
 * Iniciar sesión con Google
 */
async function signInWithGoogle() {
    try {
        if (CONFIG.options.debug) {
            console.log('🔐 Iniciando login con Google...');
        }

        // Solicitar token de acceso
        userState.tokenClient.requestAccessToken({ prompt: 'consent' });

    } catch (error) {
        console.error('❌ Error en login:', error);
        showNotification('Error al iniciar sesión: ' + error.message, 'error');
    }
}

/**
 * Callback después de autenticación
 */
async function handleAuthCallback(response) {
    try {
        if (response.error) {
            throw new Error(response.error);
        }

        // Guardar token
        userState.accessToken = response.access_token;
        gapi.client.setToken({ access_token: response.access_token });

        // Obtener perfil del usuario
        await getUserProfile();

        // Validar dominio (solo si está configurado)
        if (CONFIG.options.soloEmailUV && !isUVEmail(userState.profile.email)) {
            await signOut();
            showNotification(
                `Solo se permiten cuentas @${CONFIG.options.dominioPermitido}`,
                'error'
            );
            return;
        }

        // Verificar si es admin
        userState.isAdmin = isAdmin(userState.profile.email);

        // Actualizar UI
        userState.isLoggedIn = true;
        updateUIAfterLogin();

        if (CONFIG.options.debug) {
            console.log('✅ Login exitoso');
            console.log('👤 Usuario:', userState.profile.email);
            console.log('👑 Admin:', userState.isAdmin);
        }

        showNotification('Bienvenido, ' + userState.profile.nombre, 'success');

    } catch (error) {
        console.error('❌ Error en callback:', error);
        showNotification('Error al procesar login: ' + error.message, 'error');
    }
}

/**
 * Obtener perfil del usuario
 */
async function getUserProfile() {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${userState.accessToken}` }
        });

        if (!response.ok) {
            throw new Error('Error al obtener perfil');
        }

        const data = await response.json();

        userState.profile = {
            email: data.email,
            nombre: data.name || data.email.split('@')[0],
            foto: data.picture || '',
            googleId: data.id
        };

    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        throw error;
    }
}

/**
 * Cerrar sesión
 */
async function signOut() {
    try {
        // Revocar token
        if (userState.accessToken) {
            google.accounts.oauth2.revoke(userState.accessToken, () => {
                if (CONFIG.options.debug) {
                    console.log('🔓 Token revocado');
                }
            });
        }

        // Limpiar estado
        userState.isLoggedIn = false;
        userState.isAdmin = false;
        userState.accessToken = null;
        userState.profile = {
            email: '',
            nombre: '',
            foto: '',
            googleId: ''
        };

        // Limpiar cliente
        gapi.client.setToken(null);

        // Actualizar UI
        updateUIAfterLogout();

        if (CONFIG.options.debug) {
            console.log('👋 Sesión cerrada');
        }

        showNotification('Sesión cerrada', 'info');

    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
    }
}

// ════════════════════════════════════════════════════════════════
// UI UPDATES
// ════════════════════════════════════════════════════════════════

function updateUIAfterLogin() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';

    // Mostrar menú de navegación (Dashboard)
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.style.display = 'flex';

    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                ${userState.profile.foto ? 
                    `<img src="${userState.profile.foto}" alt="Foto" style="width: 32px; height: 32px; border-radius: 50%;">` : 
                    `<div style="width: 32px; height: 32px; border-radius: 50%; background: #0078D4; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                        ${userState.profile.nombre.charAt(0).toUpperCase()}
                    </div>`
                }
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${userState.profile.nombre}</div>
                    <div style="font-size: 12px; color: #605E5C;">${userState.profile.email}</div>
                </div>
                <button onclick="signOut()" class="btn btn-secondary" style="margin-left: 12px; padding: 8px 16px;">Salir</button>
            </div>
        `;
    }
}

function updateUIAfterLogout() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
    
    // Ocultar menú de navegación
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.style.display = 'none';

    document.getElementById('user-info').innerHTML = '';
    showSection('home');
}

// ════════════════════════════════════════════════════════════════
// INICIALIZACIÓN AL CARGAR PÁGINA
// ════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', async () => {
    try {
        if (CONFIG.options.debug) {
            console.log('🚀 Iniciando sistema CITRO Google...');
        }

        // Cargar APIs de Google
        await Promise.all([
            loadGoogleAPI(),
            loadGoogleIdentity()
        ]);

        // Inicializar token client
        initTokenClient();

        if (CONFIG.options.debug) {
            console.log('✅ Sistema listo');
        }

    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showNotification('Error al cargar el sistema: ' + error.message, 'error');
    }
});

// ════════════════════════════════════════════════════════════════
// LOG
// ════════════════════════════════════════════════════════════════

if (CONFIG?.options?.debug) {
    console.log('📦 google-auth.js cargado');
}
