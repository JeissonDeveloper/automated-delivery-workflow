// ============================================================================
// FORMULARIO DE ENTREGA DE DISPOSITIVOS MÓVILES - RAMO
// Versión: 3.0 VISUAL - Actualizada Enero 2025
// Archivo: script.js
// Requiere: animaciones.css
// ============================================================================

// URLS POWER AUTOMATE
const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

// Variables globales
let sigColab, sigAna;
let enviandoFormulario = false;

// ============================================================================
// SISTEMA DE NOTIFICACIONES
// ============================================================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    let container = document.getElementById('notificaciones-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificaciones-container';
        document.body.appendChild(container);
    }
    
    const notificacion = document.createElement('div');
    
    // Estilos según tipo
    const estilos = {
        success: { bg: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', color: '#155724', border: '#c3e6cb' },
        error: { bg: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)', color: '#721c24', border: '#f5c6cb' },
        warning: { bg: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)', color: '#856404', border: '#ffeeba' },
        info: { bg: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)', color: '#0c5460', border: '#bee5eb' }
    };
    
    const estilo = estilos[tipo];
    notificacion.style.background = estilo.bg;
    notificacion.style.color = estilo.color;
    notificacion.style.border = `2px solid ${estilo.border}`;
    
    const icono = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️';
    notificacion.innerHTML = `<span style="font-size: 1.5rem;">${icono}</span><span>${mensaje}</span>`;
    
    container.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 5000);
}

// ============================================================================
// INDICADOR DE CONEXIÓN
// ============================================================================
function actualizarIndicadorConexion(estado) {
    let indicador = document.getElementById('connection-indicator');
    
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'connection-indicator';
        indicador.className = 'connection-indicator';
        document.body.appendChild(indicador);
    }
    
    if (estado === 'conectado') {
        indicador.className = 'connection-indicator online';
        indicador.innerHTML = '<span>🟢</span> Conectado';
    } else if (estado === 'verificando') {
        indicador.className = 'connection-indicator checking';
        indicador.innerHTML = '<span>🟡</span> Verificando...';
    } else {
        indicador.className = 'connection-indicator offline';
        indicador.innerHTML = '<span>🔴</span> Sin conexión';
    }
}

// ============================================================================
// BARRA DE PROGRESO
// ============================================================================
function actualizarBarraProgreso() {
    const camposRequeridos = [
        'cedula', 'nombre_colaborador', 'correo_colaborador', 'operacion',
        'marca', 'modelo', 'serial', 'ciudad'
    ];
    
    let completados = 0;
    camposRequeridos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && campo.value.trim() !== '') completados++;
    });
    
    if (sigColab && sigColab.isSigned()) completados++;
    if (sigAna && sigAna.isSigned()) completados++;
    
    const total = camposRequeridos.length + 2;
    const porcentaje = Math.round((completados / total) * 100);
    
    let barra = document.getElementById('progress-bar-container');
    if (!barra) {
        barra = document.createElement('div');
        barra.id = 'progress-bar-container';
        barra.className = 'progress-bar-container';
        barra.innerHTML = '<div class="progress-bar-fill" id="progress-bar-fill"></div>';
        document.body.prepend(barra);
    }
    
    document.getElementById('progress-bar-fill').style.width = porcentaje + '%';
}

// ============================================================================
// CONFETI
// ============================================================================
function lanzarConfeti() {
    const colores = ['#B70000', '#FF4444', '#FFA500', '#4CAF50', '#2196F3', '#9C27B0'];
    const cantidad = 50;
    
    for (let i = 0; i < cantidad; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colores[Math.floor(Math.random() * colores.length)];
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3500);
        }, i * 30);
    }
}

// ============================================================================
// MODAL DE PREVIEW
// ============================================================================
function mostrarPreview(datos) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-preview-overlay';
        
        modal.innerHTML = `
            <div class="modal-preview-content">
                <h2>Confirmar Envío de Acta</h2>
                <div class="modal-preview-info">
                    <p><strong>Quien Recibe:</strong> ${datos.nombre_colaborador}</p>
                    <p><strong>Cédula:</strong> ${datos.cedula}</p>
                    <p><strong>Dispositivo:</strong> ${datos.marca} ${datos.modelo}</p>
                    <p><strong>Serial:</strong> ${datos.serial}</p>
                    <p><strong>Fecha:</strong> ${datos.fecha}</p>
                    <p><strong>Quien Entrega:</strong> ${datos.nombre_analista || 'N/A'}</p>
                </div>
                <div class="modal-preview-buttons">
                    <button id="btn-cancelar-preview">Cancelar</button>
                    <button id="btn-confirmar-preview">✓ Confirmar Envío</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btn-cancelar-preview').onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        document.getElementById('btn-confirmar-preview').onclick = () => {
            modal.remove();
            resolve(true);
        };
    });
}

// ============================================================================
// LOADING SKELETON
// ============================================================================
function mostrarSkeletonCarga(tipo) {
    const campos = tipo === 'colab' 
        ? ['nombre_colaborador', 'agencia', 'telefono']
        : ['nombre_analista', 'agencia_analista', 'telefono_analista'];
    
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.value = '';
            campo.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
            campo.style.backgroundSize = '200% 100%';
            campo.style.animation = 'shimmer 1.5s infinite';
        }
    });
}

function quitarSkeletonCarga(tipo) {
    const campos = tipo === 'colab' 
        ? ['nombre_colaborador', 'agencia', 'telefono']
        : ['nombre_analista', 'agencia_analista', 'telefono_analista'];
    
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.style.background = '';
            campo.style.animation = '';
        }
    });
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    configurarFechaActual();
    actualizarIndicadorConexion('conectado');
    actualizarBarraProgreso();
    
    const params = new URLSearchParams(window.location.search);
    if(params.get("serial")) {
        document.getElementById("serial").value = params.get("serial");
    }

    sigColab = setupCanvas("canvas_colaborador");
    sigAna = setupCanvas("canvas_analista");

    cargarDatosLocales();

    ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
    
    document.getElementById("formulario").addEventListener("input", () => {
        actualizarBarraProgreso();
    });
    
    console.log("✅ Formulario RAMO v3.0 VISUAL inicializado");
});

// ============================================================================
// CONFIGURACIÓN DE FECHA
// ============================================================================
function configurarFechaActual() {
    const ahora = new Date();
    const fechaColombia = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    const año = fechaColombia.getFullYear();
    const mes = String(fechaColombia.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaColombia.getDate()).padStart(2, '0');
    
    document.getElementById("fecha").value = `${año}-${mes}-${dia}`;
}

// ============================================================================
// PERSISTENCIA
// ============================================================================
function guardarDatosLocales() {
    const inputs = document.querySelectorAll("input, select, textarea");
    const datos = {};
    
    inputs.forEach(el => {
        if (el.name && el.name !== 'serial') {
            if (el.type === 'radio') {
                if (el.checked) datos[el.name] = el.value;
            } else if (el.type === 'checkbox') {
                datos[el.name] = el.checked;
            } else {
                datos[el.name] = el.value;
            }
        }
    });
    localStorage.setItem("acta_ramo_borrador", JSON.stringify(datos));
}

function cargarDatosLocales() {
    const guardado = localStorage.getItem("acta_ramo_borrador");
    if (!guardado) return;

    const datos = JSON.parse(guardado);
    const inputs = document.querySelectorAll("input, select, textarea");

    inputs.forEach(el => {
        if (el.name && el.name !== 'serial' && datos[el.name] !== undefined) {
            if (el.type === 'radio') {
                if (el.value === datos[el.name]) el.checked = true;
            } else if (el.type === 'checkbox') {
                el.checked = datos[el.name];
            } else {
                el.value = datos[el.name];
            }
        }
    });
}

function borrarDatosLocales() {
    localStorage.removeItem("acta_ramo_borrador");
}

// ============================================================================
// BLOQUEO DE ACCESORIOS
// ============================================================================
window.toggleAccesorio = (item) => {
    const radios = document.getElementsByName(`entrega_${item}`);
    let valor = "No";
    
    for (const r of radios) {
        if (r.checked) {
            valor = r.value;
            break;
        }
    }

    let nombreSelect = `estado_${item}`;
    if (item === 'bateria') nombreSelect = `estado_bateria_item`;

    const selectEstado = document.querySelector(`select[name="${nombreSelect}"]`);
    const inputObs = document.getElementById(`obs_${item}`);

    if (valor === "No") {
        if (selectEstado) {
            selectEstado.disabled = true;
            selectEstado.value = "Bueno"; // Cambiado de N/A a Bueno
            selectEstado.classList.add("bloqueado");
        }
        if (inputObs) {
            inputObs.disabled = true;
            inputObs.value = "";
            inputObs.classList.add("bloqueado");
        }
    } else {
        if (selectEstado) {
            selectEstado.disabled = false;
            selectEstado.classList.remove("bloqueado");
        }
        if (inputObs) {
            inputObs.disabled = false;
            inputObs.classList.remove("bloqueado");
        }
    }
    
    actualizarBarraProgreso();
};

// ============================================================================
// BÚSQUEDA
// ============================================================================
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colab');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');

async function realizarBusqueda(cedula, tipo) {
    if(!cedula || cedula.trim() === "") { 
        mostrarNotificacion("Por favor ingrese una cédula válida", 'warning');
        return; 
    }
    
    const sufijo = tipo === 'colab' ? 'colaborador' : 'analista';
    const nombreVisible = tipo === 'colab' ? 'Quien Recibe' : 'Quien Entrega';
    const icono = document.getElementById("icono-busqueda-" + sufijo);
    const msg = document.getElementById("msg-" + sufijo);
    
    actualizarIndicadorConexion('verificando');
    mostrarSkeletonCarga(tipo);
    
    icono.innerHTML = '<span class="spinner"></span>'; 
    msg.innerText = `Consultando datos de ${nombreVisible}...`; 
    msg.style.color = "#666";

    try {
        const resp = await fetch(URL_BUSQUEDA, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ cedula: cedula.trim() })
        });
        
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        
        const data = await resp.json();
        quitarSkeletonCarga(tipo);
        icono.innerHTML = "🔍";
        actualizarIndicadorConexion('conectado');

        if (data && data.nombre_colaborador) {
            msg.innerText = "✅ Información cargada correctamente"; 
            msg.style.color = "green";
            
            if(tipo === 'colab') {
                animarCampoCompletado('nombre_colaborador', data.nombre_colaborador || "");
                animarCampoCompletado('agencia', data.agencia || "");
                animarCampoCompletado('telefono', data.telefono || "");
            } else {
                animarCampoCompletado('nombre_analista', data.nombre_colaborador || "");
                animarCampoCompletado('agencia_analista', data.agencia || "");
                animarCampoCompletado('telefono_analista', data.telefono || "");
                
                if (data.codigo_sap) animarCampoCompletado('codigo_sap_analista', data.codigo_sap);
                if (data.cargo) animarCampoCompletado('cargo_analista', data.cargo);
                if (data.zona) animarCampoCompletado('zona_analista', data.zona);
            }
            
            guardarDatosLocales();
            actualizarBarraProgreso();
            mostrarNotificacion(`Datos de ${nombreVisible} cargados exitosamente`, 'success');
        } else {
            msg.innerText = "❌ Cédula no encontrada"; 
            msg.style.color = "red";
            mostrarNotificacion("No se encontró información para esta cédula", 'error');
        }
    } catch (err) {
        console.error("Error en búsqueda:", err);
        quitarSkeletonCarga(tipo);
        icono.innerHTML = "🔍";
        msg.innerText = "❌ Error de conexión"; 
        msg.style.color = "red";
        actualizarIndicadorConexion('offline');
        mostrarNotificacion("Error de conexión. Verifique su internet.", 'error');
    }
}

function animarCampoCompletado(id, valor) {
    const campo = document.getElementById(id);
    if (!campo) return;
    
    campo.value = valor;
    campo.classList.add('campo-completado');
    setTimeout(() => campo.classList.remove('campo-completado'), 1000);
}

// ============================================================================
// FIRMAS NIVEL 4 - ULTRA PROFESIONAL
// - Suavizado Catmull-Rom (trazo perfecto)
// - Estabilización de temblor
// - Simulación de tinta con difuminado
// - Ajuste automático de tamaño
// - Grosor Fino Visible: 1.0-1.9px
// ============================================================================
function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext("2d");
    let drawing = false;
    let wasUsed = false;
    let imageData = null;
    
    // Variables para trazo suave y estabilización
    let points = [];
    let lastPoint = null;
    
    // Variables para auto-ajuste de tamaño
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    const resize = () => {
        if (wasUsed && c.width > 0 && c.height > 0) {
            try {
                imageData = ctx.getImageData(0, 0, c.width, c.height);
            } catch(e) {
                console.log("No se pudo guardar firma");
            }
        }
        
        c.width = c.offsetWidth; 
        c.height = 140;
        
        if (imageData) {
            try {
                ctx.putImageData(imageData, 0, 0);
            } catch(e) {
                console.log("No se pudo restaurar firma");
            }
        }
    };
    
    resize();

    // Función de interpolación Catmull-Rom para trazo súper suave
    const catmullRomSpline = (p0, p1, p2, p3, t) => {
        const v0 = (p2 - p0) * 0.5;
        const v1 = (p3 - p1) * 0.5;
        const t2 = t * t;
        const t3 = t * t2;
        
        return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
               (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
               v0 * t + p1;
    };

    // Estabilización de temblor (filtro de media móvil)
    const stabilizePoint = (newPoint) => {
        if (points.length < 2) return newPoint;
        
        // Promedio de últimos 3 puntos para suavizar temblor
        const recentPoints = points.slice(-2);
        const avgX = (recentPoints.reduce((sum, p) => sum + p.x, 0) + newPoint.x) / 3;
        const avgY = (recentPoints.reduce((sum, p) => sum + p.y, 0) + newPoint.y) / 3;
        
        return {x: avgX, y: avgY, time: newPoint.time};
    };

    // Dibujar con simulación de tinta (difuminado sutil)
    const drawInkStroke = (x1, y1, x2, y2, pressure) => {
        // Grosor Fino Visible basado en presión
        const minWidth = 1.0;
        const maxWidth = 1.9;
        const lineWidth = minWidth + (pressure * (maxWidth - minWidth));
        
        // Color tinta con leve transparencia para efecto difuminado
        ctx.strokeStyle = "rgba(26, 26, 26, 0.95)"; // Negro tinta semi-transparente
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        // Dibujar línea principal
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Efecto de difuminado (borde más suave)
        ctx.strokeStyle = "rgba(26, 26, 26, 0.15)";
        ctx.lineWidth = lineWidth + 0.8;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    // Dibujar segmento con interpolación Catmull-Rom
    const drawSmoothSegment = (p0, p1, p2, p3, velocity) => {
        const steps = 8; // Número de puntos interpolados
        const pressure = Math.max(0, Math.min(1, 1 - (velocity / 15)));
        
        for (let i = 0; i < steps; i++) {
            const t1 = i / steps;
            const t2 = (i + 1) / steps;
            
            const x1 = catmullRomSpline(p0.x, p1.x, p2.x, p3.x, t1);
            const y1 = catmullRomSpline(p0.y, p1.y, p2.y, p3.y, t1);
            const x2 = catmullRomSpline(p0.x, p1.x, p2.x, p3.x, t2);
            const y2 = catmullRomSpline(p0.y, p1.y, p2.y, p3.y, t2);
            
            drawInkStroke(x1, y1, x2, y2, pressure);
            
            // Actualizar límites para auto-ajuste
            minX = Math.min(minX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxX = Math.max(maxX, x1, x2);
            maxY = Math.max(maxY, y1, y2);
        }
    };

    const start = (e) => {
        if (e.target === c) {
            e.target.style.userSelect = 'none';
            e.target.style.webkitUserSelect = 'none';
            e.target.style.webkitTouchCallout = 'none';
        }
        
        const rect = c.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        
        if (x >= 0 && x <= c.width && y >= 0 && y <= c.height) {
            drawing = true; 
            wasUsed = true;
            
            // Resetear límites para auto-ajuste
            minX = x; minY = y; maxX = x; maxY = y;
            
            // Inicializar puntos
            const point = {x, y, time: Date.now()};
            points = [point, point, point, point]; // Duplicar para Catmull-Rom
            lastPoint = point;
            
            // Dibujar punto inicial con efecto de tinta
            ctx.fillStyle = "rgba(26, 26, 26, 0.95)";
            ctx.beginPath();
            ctx.arc(x, y, 1.0, 0, Math.PI * 2);
            ctx.fill();
            
            // Difuminado del punto inicial
            ctx.fillStyle = "rgba(26, 26, 26, 0.15)";
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            c.classList.add('canvas-firmando');
            mostrarMensajeFirma(c.parentElement, true);
            
            e.preventDefault();
            e.stopPropagation();
        }
    };
    
    const move = (e) => {
        if(!drawing) return;
        
        const rect = c.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
        const time = Date.now();
        
        // Crear nuevo punto
        const newPoint = {x, y, time};
        
        // Estabilizar para eliminar temblor
        const stabilized = stabilizePoint(newPoint);
        
        // Calcular velocidad para presión
        const dx = stabilized.x - lastPoint.x;
        const dy = stabilized.y - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = time - lastPoint.time;
        const velocity = distance / (timeDiff || 1);
        
        // Agregar punto estabilizado
        points.push(stabilized);
        
        // Dibujar con interpolación Catmull-Rom si hay suficientes puntos
        if (points.length >= 4) {
            const p0 = points[points.length - 4];
            const p1 = points[points.length - 3];
            const p2 = points[points.length - 2];
            const p3 = points[points.length - 1];
            
            drawSmoothSegment(p0, p1, p2, p3, velocity);
        }
        
        lastPoint = stabilized;
        
        // Mantener ventana deslizante de puntos
        if (points.length > 8) {
            points.shift();
        }
        
        e.preventDefault();
        e.stopPropagation();
    };
    
    const end = (e) => { 
        if (drawing) {
            drawing = false;
            
            // Auto-ajuste de tamaño (si firma es muy pequeña/grande)
            autoAdjustSignature();
            
            points = [];
            lastPoint = null;
            
            c.classList.remove('canvas-firmando');
            mostrarMensajeFirma(c.parentElement, false);
            mostrarCheckFirma(c.parentElement);
            actualizarBarraProgreso();
            e.preventDefault();
        }
    };

    // Ajuste automático de tamaño de firma
    const autoAdjustSignature = () => {
        const padding = 10;
        const signatureWidth = maxX - minX;
        const signatureHeight = maxY - minY;
        
        // Si la firma es muy pequeña o muy grande, ajustar
        const minSize = 50;
        const optimalWidth = c.width * 0.7; // 70% del ancho
        
        if (signatureWidth < minSize || signatureWidth < optimalWidth * 0.4) {
            // Firma muy pequeña - escalar
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = c.width;
            tempCanvas.height = c.height;
            
            try {
                // Copiar firma actual
                tempCtx.drawImage(c, 0, 0);
                
                // Calcular escala
                const scale = Math.min(
                    optimalWidth / signatureWidth,
                    (c.height - padding * 2) / signatureHeight
                );
                
                // Limpiar y redibujar escalado y centrado
                ctx.clearRect(0, 0, c.width, c.height);
                
                const scaledWidth = signatureWidth * scale;
                const scaledHeight = signatureHeight * scale;
                const offsetX = (c.width - scaledWidth) / 2 - minX * scale;
                const offsetY = (c.height - scaledHeight) / 2 - minY * scale;
                
                ctx.save();
                ctx.translate(offsetX, offsetY);
                ctx.scale(scale, scale);
                ctx.drawImage(tempCanvas, 0, 0);
                ctx.restore();
            } catch(e) {
                console.log("No se pudo ajustar tamaño de firma");
            }
        }
    };

    // Eventos de mouse
    c.addEventListener("mousedown", start); 
    c.addEventListener("mousemove", move); 
    c.addEventListener("mouseup", end);
    c.addEventListener("mouseout", end);
    
    // Eventos táctiles
    c.addEventListener("touchstart", start, {passive:false});
    c.addEventListener("touchmove", move, {passive:false});
    c.addEventListener("touchend", end, {passive:false});
    c.addEventListener("touchcancel", end, {passive:false});
    
    // Prevenir gestos
    c.addEventListener("gesturestart", (e) => e.preventDefault());
    c.addEventListener("gesturechange", (e) => e.preventDefault());
    c.addEventListener("gestureend", (e) => e.preventDefault());
    
    return {
        c, 
        ctx, 
        isSigned: () => wasUsed, 
        reset: () => { 
            wasUsed = false; 
            drawing = false;
            imageData = null;
            points = [];
            lastPoint = null;
            minX = Infinity; minY = Infinity;
            maxX = -Infinity; maxY = -Infinity;
            quitarCheckFirma(c.parentElement); 
        }
    };
}

function mostrarMensajeFirma(contenedor, mostrar) {
    let msg = contenedor.querySelector('.msg-firmando');
    if (mostrar && !msg) {
        msg = document.createElement('div');
        msg.className = 'msg-firmando';
        msg.textContent = 'Firmando...';
        contenedor.appendChild(msg);
    } else if (!mostrar && msg) {
        msg.remove();
    }
}

function mostrarCheckFirma(contenedor) {
    if (contenedor.querySelector('.firma-check')) return;
    
    const check = document.createElement('div');
    check.className = 'firma-check';
    check.innerHTML = '✓';
    contenedor.style.position = 'relative';
    contenedor.appendChild(check);
}

function quitarCheckFirma(contenedor) {
    const check = contenedor.querySelector('.firma-check');
    if (check) check.remove();
}

window.limpiarFirma = (quien) => {
    const target = quien === 'colab' ? sigColab : sigAna;
    target.ctx.clearRect(0, 0, target.c.width, target.c.height);
    target.reset();
    actualizarBarraProgreso();
};

// ============================================================================
// VALIDACIONES
// ============================================================================
function validarFormulario() {
    const errores = [];
    
    const serial = document.getElementById("serial").value.trim();
    if (!serial || serial === "") {
        errores.push("El campo SERIAL es obligatorio y no puede estar vacío.");
    }
    
    if (!sigColab.isSigned()) {
        errores.push("La firma de quien RECIBE es obligatoria.");
    }
    
    if (!sigAna.isSigned()) {
        errores.push("La firma de quien ENTREGA es obligatoria.");
    }
    
    const camposRequeridos = [
        { id: 'cedula', nombre: 'Cédula de quien Recibe' },
        { id: 'nombre_colaborador', nombre: 'Nombre de quien Recibe' },
        { id: 'correo_colaborador', nombre: 'Correo de quien Recibe' },
        { id: 'operacion', nombre: 'Cargo/Operación' },
        { id: 'marca', nombre: 'Marca del Dispositivo' },
        { id: 'modelo', nombre: 'Modelo del Dispositivo' }
    ];
    
    camposRequeridos.forEach(campo => {
        const valor = document.getElementById(campo.id).value.trim();
        if (!valor || valor === "") {
            errores.push(`El campo "${campo.nombre}" es obligatorio.`);
        }
    });
    
    return errores;
}

// ============================================================================
// ENVÍO
// ============================================================================
document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (enviandoFormulario) {
        mostrarNotificacion("El formulario ya se está enviando. Por favor espere...", 'warning');
        return;
    }

    const errores = validarFormulario();
    if (errores.length > 0) {
        mostrarNotificacion("ERRORES EN EL FORMULARIO:", 'error');
        errores.forEach(error => {
            setTimeout(() => mostrarNotificacion(error, 'error'), 100);
        });
        return;
    }

    const valRadio = (name) => { 
        const el = document.querySelector(`input[name="${name}"]:checked`); 
        return el ? el.value : "No"; 
    };
    
    const valSelect = (name) => {
        const el = document.querySelector(`select[name="${name}"]`);
        if (el.disabled) return "Bueno"; // Cambiado de N/A a Bueno
        return el.value || "Bueno";
    };
    
    const valInput = (id) => {
        const el = document.getElementById(id);
        if (el.disabled) return "";
        return el.value.trim();
    };

    const data = {
        cedula: valInput("cedula"),
        nombre_colaborador: valInput("nombre_colaborador"),
        agencia: valInput("agencia"),
        telefono: valInput("telefono"),
        correo_colaborador: valInput("correo_colaborador"),
        codigo_sap: valInput("codigo_sap"),
        zona_colaborador: valInput("zona_colaborador"),
        operacion: valInput("operacion"),
        ciudad: valInput("ciudad"),
        fecha: valInput("fecha"),
        tipo_equipo: "Handheld",
        marca: valInput("marca"),
        modelo: valInput("modelo"),
        serial: valInput("serial"),
        entrega_terminal: valRadio("entrega_terminal"), 
        estado_terminal: valSelect("estado_terminal"), 
        obs_terminal: valInput("obs_terminal"),
        entrega_pantalla: valRadio("entrega_pantalla"), 
        estado_pantalla: valSelect("estado_pantalla"), 
        obs_pantalla: valInput("obs_pantalla"),
        entrega_estuche: valRadio("entrega_estuche"), 
        estado_estuche: valSelect("estado_estuche"), 
        obs_estuche: valInput("obs_estuche"),
        entrega_bateria: valRadio("entrega_bateria"), 
        estado_bateria: valSelect("estado_bateria_item"), 
        obs_bateria: valInput("obs_bateria"),
        entrega_cargador: valRadio("entrega_cargador"), 
        estado_cargador: valSelect("estado_cargador"), 
        obs_cargador: valInput("obs_cargador"),
        entrega_cable: valRadio("entrega_cable"), 
        estado_cable: valSelect("estado_cable"), 
        obs_cable: valInput("obs_cable"),
        entrega_sim: valRadio("entrega_sim"), 
        estado_sim: valSelect("estado_sim"), 
        obs_sim: valInput("obs_sim"),
        accesorios_adicionales: valInput("accesorios_adicionales"),
        observaciones: valInput("observaciones"),
        cedula_analista: valInput("cedula_analista"),
        nombre_analista: valInput("nombre_analista"),
        agencia_analista: valInput("agencia_analista"),
        telefono_analista: valInput("telefono_analista"),
        codigo_sap_analista: valInput("codigo_sap_analista"),
        cargo_analista: valInput("cargo_analista"),
        zona_analista: valInput("zona_analista"),
        firma_colaborador: sigColab.c.toDataURL().split(",")[1],
        firma_analista: sigAna.c.toDataURL().split(",")[1]
    };
    
    // PREVIEW
    const confirmar = await mostrarPreview(data);
    if (!confirmar) {
        mostrarNotificacion("Envío cancelado", 'info');
        return;
    }
    
    enviandoFormulario = true;
    
    const estadoDiv = document.getElementById("estado-envio");
    const btnEnviar = document.querySelector('.btn-principal');
    
    btnEnviar.disabled = true;
    btnEnviar.style.opacity = "0.6";
    btnEnviar.style.cursor = "not-allowed";
    btnEnviar.classList.add('btn-enviando');
    
    estadoDiv.innerHTML = '<span class="spinner"></span> Preparando envío... 20%';
    setTimeout(() => { estadoDiv.innerHTML = '<span class="spinner"></span> Generando documento... 50%'; }, 500);
    setTimeout(() => { estadoDiv.innerHTML = '<span class="spinner"></span> Enviando acta... 80%'; }, 1000);

    try {
        const resp = await fetch(URL_ENVIO, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(data)
        });
        
        if(resp.ok) {
            estadoDiv.innerHTML = "✅ ¡Acta enviada exitosamente!";
            estadoDiv.style.color = "green";
            
            mostrarNotificacion("Acta generada y enviada correctamente", 'success');
            lanzarConfeti();
            
            setTimeout(() => {
                mostrarNotificacion("Puede realizar una nueva entrega", 'info');
                
                borrarDatosLocales();
                document.getElementById("formulario").reset();
                limpiarFirma('colab'); 
                limpiarFirma('ana');
                configurarFechaActual();
                
                ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
                
                enviandoFormulario = false;
                btnEnviar.disabled = false;
                btnEnviar.style.opacity = "1";
                btnEnviar.style.cursor = "pointer";
                btnEnviar.classList.remove('btn-enviando');
                estadoDiv.innerHTML = "";
                actualizarBarraProgreso();
            }, 3000);
            
        } else {
            throw new Error(`Error HTTP: ${resp.status}`);
        }
    } catch(err) {
        console.error("Error al enviar:", err);
        estadoDiv.innerHTML = "❌ Error al enviar el acta";
        estadoDiv.style.color = "red";
        
        mostrarNotificacion("Error al enviar el acta. Verifique su conexión e intente nuevamente.", 'error');
        
        enviandoFormulario = false;
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = "1";
        btnEnviar.style.cursor = "pointer";
        btnEnviar.classList.remove('btn-enviando');
    }
});

// ============================================================================
// VALIDACIONES DE ENTRADA
// ============================================================================
const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");

document.getElementById("cedula").addEventListener("input", soloNumeros);
document.getElementById("cedula_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap_analista").addEventListener("input", soloNumeros);
document.getElementById("codigo_sap").addEventListener("input", soloNumeros);

document.getElementById("cedula").addEventListener("input", function() {
    if (this.value.length >= 7) {
        this.classList.add('campo-completado');
        this.classList.remove('campo-error');
    } else {
        this.classList.remove('campo-completado');
    }
});

document.getElementById("cedula").addEventListener("blur", function() {
    if (this.value.length > 0 && this.value.length < 7) {
        this.classList.add('campo-error');
    }
});

document.getElementById("correo_colaborador").addEventListener("blur", function() {
    const correo = this.value.trim();
    if (correo && !correo.includes("@")) {
        this.classList.add('campo-error');
        this.classList.remove('campo-completado');
        mostrarNotificacion("Por favor ingrese un correo electrónico válido", 'warning');
        this.focus();
    } else if (correo && correo.includes("@")) {
        this.classList.add('campo-completado');
        this.classList.remove('campo-error');
    }
});

document.getElementById("serial").addEventListener("input", function() {
    if (this.value.length >= 5) {
        this.classList.add('campo-completado');
        this.classList.remove('campo-error');
    } else {
        this.classList.remove('campo-completado');
    }
});

console.log("📝 RAMO v3.0 VISUAL - Cargado");
