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
        // Obtener en: console.cloud.google.com
        
        scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/gmail.send'
        ],
        
        // URLs permitidas
        redirectUri: window.location.origin,
        
        // Discovery docs
        discoveryDocs: [
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
        ]
    },

    // ━━━ GOOGLE SHEETS (BASE DE DATOS) ━━━━━━━━━━━━━━━━━━━━━━━
    sheets: {
        // ID del spreadsheet (crear manualmente primero)
        spreadsheetId: '1ZbGK8Nfzp4UTtEyyvlXpYiRfVWxVBTNZvxJw9HMpVMA/edit?gid=0#gid=0',
        // Ejemplo: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
        
        // Nombre de la hoja
        sheetName: 'Solicitudes',
        
        // Columnas (A-N)
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
        // ID de la carpeta raíz (crear manualmente primero)
        rootFolderId: 'z5HUCrcTBtBCWmQiMPXw',
        // Ejemplo: 1dyUEebJaFnWa3Z4n0BFMVAXQ7mfUH11g
        
        // Nombres de carpetas por tipo
        folders: {
            apoyo_academico:     '01_Apoyo_Academico',
            aval_institucional:  '02_Aval_Institucional',
            apoyo_terceros:      '03_Apoyo_Terceros',
            comite_tutorial:     '04_Comite_Tutorial',
            solicitud_libre:     '05_Solicitud_Libre'
        },
        
        // IDs de carpetas (se llenan automáticamente)
        folderIds: {}
    },

    // ━━━ ADMINISTRADORES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    admins: [
        'jcfaicus@gmail.com',
        'rmenchaca@uv.mx',
        'carlolopezo@uv.mx',
        'ctecnicocitro@uv.mx'
    ],

    // ━━━ INFORMACIÓN INSTITUCIONAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    institucion: {
        nombre:      'Centro de Investigaciones Tropicales',
        nombreCorto: 'CITRO',
        universidad: 'Universidad Veracruzana',
        email:       'ctecnicocitro@uv.mx',
        telefono:    '228-842-1800',
        direccion:   'Xalapa, Veracruz, México',
        sitioWeb:    'https://www.uv.mx/citro'
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
        soloEmailUV: true,
        dominioPermitido: 'uv.mx',
        plazoMinimoDias: 21,
        montoMaximo: 100000,
        requiereJustificacionSi: 50000,
        debug: true
    },

    // ━━━ CONFIGURACIÓN DE FORMULARIOS ━━━━━━━━━━━━━━━━━━━━━━━━
    formularios: {
        formatoFolio: {
            apoyo_academico:    'AAC',
            aval_institucional: 'AVI',
            apoyo_terceros:     'TER',
            comite_tutorial:    'CMT',
            solicitud_libre:    'LIB'
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
    
    if (CONFIG.drive.rootFolderId.includes('TU_FOLDER')) {
        errores.push('⚠️ Falta configurar carpeta raíz de Drive');
    }
    
    if (errores.length > 0) {
        console.error('❌ ERRORES DE CONFIGURACIÓN:');
        errores.forEach(e => console.error(e));
        console.log('📖 Lee GUIA-INSTALACION-GOOGLE.md');
    } else if (CONFIG.options.debug) {
        console.log('✅ Configuración Google validada');
        console.log('📊 Spreadsheet:', CONFIG.sheets.spreadsheetId);
        console.log('📁 Drive Folder:', CONFIG.drive.rootFolderId);
    }
})();
