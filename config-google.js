/**
 * ═══════════════════════════════════════════════════════════════
 * CITRO — Configuración Google
 * Sistema 100% Google Workspace
 * Universidad Veracruzana
 * ═══════════════════════════════════════════════════════════════
 */

const CONFIG = {

    // ━━━ GOOGLE OAUTH 2.0 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    google: {
        clientId: '147189238289-of5eo5pj678jvidq07i38g04hjm136kb.apps.googleusercontent.com',
        // ↑ CORREGIDO: Quitado el "1" extra del inicio
        
        scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/gmail.send'
        ],

        redirectUri: window.location.origin,

        discoveryDocs: [
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
        ]
    },

    // ━━━ GOOGLE SHEETS (BASE DE DATOS) ━━━━━━━━━━━━━━━━━━━━━━━
    sheets: {
        spreadsheetId: '1ZbGK8Nfzp4UTtEyyvlXpYiRfVWxVBTNZvxJw9HMpVMA',
        // ↑ CORREGIDO: Solo el ID, sin /edit ni #gid
        
        sheetName: 'Solicitudes',

        columns: [
            'Folio',              // A
            'Fecha',              // B
            'Tipo',               // C
            'Nombre',             // D
            'Email',              // E
            'Matricula',          // F
            'Monto',              // G
            'Estado',             // H
            'PDF_URL',            // I
            'PDF_ID',             // J
            'Datos_JSON',         // K
            'Notas_CT',           // L
            'Usuario_Google',     // M
            'Timestamp'           // N
        ]
    },

    // ━━━ GOOGLE DRIVE (ALMACENAMIENTO) ━━━━━━━━━━━━━━━━━━━━━━━
    drive: {
        // ⚠️ IMPORTANTE: Obtener el ID correcto de Google Drive
        // Abrir la carpeta en Drive y copiar el ID de la URL
        rootFolderId: 'PONER_FOLDER_ID_AQUI',
        // Ejemplo: https://drive.google.com/drive/folders/1dyUEebJ...
        //                                              ↑ Copiar este ID
        
        folders: {
            apoyo_academico: '01_Apoyo_Academico',
            aval_institucional: '02_Aval_Institucional',
            apoyo_terceros: '03_Apoyo_Terceros',
            comite_tutorial: '04_Comite_Tutorial',
            solicitud_libre: '05_Solicitud_Libre'
        },

        folderIds: {}
    },

    // ━━━ ADMINISTRADORES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    admins: [
        'citroct7@gmail.com',
        'jcfaicus@gmail.com'
    ],
    // ↑ CORREGIDO: Quitado "cx", cerrado el array correctamente

    // ━━━ INFORMACIÓN INSTITUCIONAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    institucion: {
        nombre: 'Centro de Investigaciones Tropicales',
        nombreCorto: 'CITRO',
        universidad: 'Universidad Veracruzana',
        email: 'ctecnicocitro@uv.mx',
        telefono: '228-842-1800',
        direccion: 'Xalapa, Veracruz, México',
        sitioWeb: 'https://www.uv.mx/citro'
    },

    // ━━━ CONFIGURACIÓN DE CORREOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    email: {
        adminEmail: 'ctecnicocitro@uv.mx',
        enviarConfirmacion: true,
        ccAdminEnConfirmacion: true,
        firmaEmail: 'H. Consejo Técnico del CITRO<br>Universidad Veracruzana'
    },

    // ━━━ OPCIONES DE SEGURIDAD Y VALIDACIÓN ━━━━━━━━━━━━━━━━━━
    options: {
        soloEmailUV: false,  // false = permite cualquier Google
        dominioPermitido: '',  // Vacío = sin restricción
        plazoMinimoDias: 21,
        montoMaximo: 100000,
        requiereJustificacionSi: 50000,
        debug: true
    },

    // ━━━ CONFIGURACIÓN DE FORMULARIOS ━━━━━━━━━━━━━━━━━━━━━━━━
    formularios: {
        formatoFolio: {
            apoyo_academico: 'AAC',
            aval_institucional: 'AVI',
            apoyo_terceros: 'TER',
            comite_tutorial: 'CMT',
            solicitud_libre: 'LIB'
        }
    },

    // ━━━ VERSIÓN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    version: {
        numero: '2.0',
        fecha: 'Febrero 2026',
        nombre: 'Sistema CITRO Google',
        plataforma: 'Google Workspace'
    }
};

// ━━━ VALIDACIÓN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(function validarConfig() {
    const errores = [];

    if (CONFIG.google.clientId.includes('TU_CLIENT_ID')) {
        errores.push('⚠️ Falta configurar Google Client ID');
    }

    if (CONFIG.sheets.spreadsheetId.includes('TU_SPREADSHEET')) {
        errores.push('⚠️ Falta configurar Spreadsheet ID');
    }

    if (CONFIG.drive.rootFolderId.includes('TU_FOLDER') || CONFIG.drive.rootFolderId.includes('PONER_FOLDER')) {
        errores.push('⚠️ Falta configurar carpeta raíz de Drive');
    }

    if (errores.length > 0) {
        console.error('❌ ERRORES DE CONFIGURACIÓN:');
        errores.forEach(e => console.error(e));
        console.log('📖 Lee GUIA-INSTALACION-GOOGLE.md');
    } else if (CONFIG.options.debug) {
        console.log('✅ Configuración Google validada');
        console.log('🔐 Client ID:', CONFIG.google.clientId.substring(0, 20) + '...');
        console.log('📊 Spreadsheet:', CONFIG.sheets.spreadsheetId);
        console.log('📁 Drive Folder:', CONFIG.drive.rootFolderId);
        console.log('👥 Admins:', CONFIG.admins.length);
    }
})();
