// ============================================================================
// JS MODERNIZADO v2.0 (Tech 2026) - Performance, UX, AbortControllers
// ============================================================================

// URLS POWER AUTOMATE
const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

// Variables globales
let sigColab, sigAna;
let enviandoFormulario = false;
let abortControllers = { colab: null, analista: null }; // Control de promesas múltiples
let debounceTimeout = null;

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
    const estilos = {
        success: { bg: 'var(--success-bg)', color: 'var(--success-text)', border: 'var(--success-border)', icon: '✅' },
        error: { bg: 'var(--error-bg)', color: 'var(--error-text)', border: 'var(--error-border)', icon: '❌' },
        warning: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning-border)', icon: '⚠️' },
        info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb', icon: 'ℹ️' }
    };
    
    const estilo = estilos[tipo];
    notificacion.style.background = estilo.bg;
    notificacion.style.color = estilo.color;
    notificacion.style.border = `2px solid ${estilo.border}`;
    notificacion.innerHTML = `<span style="font-size: 1.5rem;">${estilo.icon}</span><span>${mensaje}</span>`;
    
    container.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
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
        document.body.appendChild(indicador);
    }
    
    const configs = {
        'conectado': { cls: 'connection-indicator online', txt: '<span>🟢</span> Conectado' },
        'verificando': { cls: 'connection-indicator checking', txt: '<span>🟡</span> Verificando...' },
        'offline': { cls: 'connection-indicator offline', txt: '<span>🔴</span> Sin conexión' }
    };
    
    indicador.className = configs[estado].cls;
    indicador.innerHTML = configs[estado].txt;
}

// ============================================================================
// BARRA DE PROGRESO
// ============================================================================
function actualizarBarraProgreso() {
    const camposRequeridos = ['cedula', 'nombre_colaborador', 'correo_colaborador', 'operacion', 'marca', 'modelo', 'serial', 'ciudad'];
    
    let completados = camposRequeridos.reduce((acc, id) => {
        const campo = document.getElementById(id);
        return acc + (campo && campo.value.trim() !== '' ? 1 : 0);
    }, 0);
    
    if (sigColab?.isSigned()) completados++;
    if (sigAna?.isSigned()) completados++;
    
    const porcentaje = Math.round((completados / (camposRequeridos.length + 2)) * 100);
    
    let barra = document.getElementById('progress-bar-container') || (() => {
        const div = document.createElement('div');
        div.id = 'progress-bar-container';
        div.className = 'progress-bar-container';
        div.innerHTML = '<div class="progress-bar-fill" id="progress-bar-fill"></div>';
        document.body.prepend(div);
        return div;
    })();
    
    document.getElementById('progress-bar-fill').style.width = `${porcentaje}%`;
}

// ============================================================================
// CONFETI
// ============================================================================
function lanzarConfeti() {
    const colores = ['#B70000', '#FF4444', '#FFA500', '#4CAF50', '#2196F3', '#9C27B0'];
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.background = colores[Math.floor(Math.random() * colores.length)];
        confetti.style.animationDuration = `${(Math.random() * 2 + 2)}s`;
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        fragment.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3500);
    }
    document.body.appendChild(fragment);
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
                    <p><strong>Quien Recibe:</strong> ${datos.nombre_colaborador.replace(/</g, "&lt;")}</p>
                    <p><strong>Cédula:</strong> ${datos.cedula.replace(/</g, "&lt;")}</p>
                    <p><strong>Dispositivo:</strong> ${datos.marca} ${datos.modelo}</p>
                    <p><strong>Serial:</strong> ${datos.serial.replace(/</g, "&lt;")}</p>
                    <p><strong>Fecha:</strong> ${datos.fecha}</p>
                    <p><strong>Quien Entrega:</strong> ${(datos.nombre_analista || 'N/A').replace(/</g, "&lt;")}</p>
                </div>
                <div class="modal-preview-buttons">
                    <button id="btn-cancelar-preview">Cancelar</button>
                    <button id="btn-confirmar-preview">✓ Confirmar Envío</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btn-cancelar-preview').onclick = () => { modal.remove(); resolve(false); };
        document.getElementById('btn-confirmar-preview').onclick = () => { modal.remove(); resolve(true); };
    });
}

function alternarSkeleton(tipo, mostrar) {
    const campos = tipo === 'colab' ? ['nombre_colaborador', 'agencia', 'telefono'] : ['nombre_analista', 'agencia_analista', 'telefono_analista'];
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.value = mostrar ? '' : campo.value;
            campo.classList.toggle('skeleton', mostrar);
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
    if(params.get("serial")) document.getElementById("serial").value = params.get("serial").replace(/[^A-Za-z0-9\-_]/g, "");

    sigColab = setupCanvas("canvas_colaborador");
    sigAna = setupCanvas("canvas_analista");

    cargarDatosLocales();
    ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
    
    document.getElementById("formulario").addEventListener("input", () => {
        actualizarBarraProgreso();
        guardarDatosLocales(); 
    });
});

function configurarFechaActual() {
    const ahora = new Date();
    const fechaColombia = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    document.getElementById("fecha").value = fechaColombia.toISOString().split('T')[0];
}

// ============================================================================
// PERSISTENCIA (Optimizada con Debounce)
// ============================================================================
function guardarDatosLocales() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const datos = {};
        document.querySelectorAll("input, select, textarea").forEach(el => {
            if (el.name && el.name !== 'serial' && el.type !== 'file') {
                if (el.type === 'radio') { if (el.checked) datos[el.name] = el.value; } 
                else if (el.type === 'checkbox') datos[el.name] = el.checked;
                else datos[el.name] = el.value;
            }
        });
        localStorage.setItem("acta_ramo_borrador", JSON.stringify(datos));
    }, 500); 
}

function cargarDatosLocales() {
    const guardado = localStorage.getItem("acta_ramo_borrador");
    if (!guardado) return;
    try {
        const datos = JSON.parse(guardado);
        document.querySelectorAll("input, select, textarea").forEach(el => {
            if (el.name && el.name !== 'serial' && datos[el.name] !== undefined) {
                if (el.type === 'radio') el.checked = (el.value === datos[el.name]);
                else if (el.type === 'checkbox') el.checked = datos[el.name];
                else el.value = datos[el.name];
            }
        });
    } catch(e) { console.error("Error leyendo LocalStorage", e); }
}

function borrarDatosLocales() { localStorage.removeItem("acta_ramo_borrador"); }

// ============================================================================
// BLOQUEO DE ACCESORIOS
// ============================================================================
window.toggleAccesorio = (item) => {
    const radios = document.getElementsByName(`entrega_${item}`);
    const valor = Array.from(radios).find(r => r.checked)?.value || "No";

    const nombreSelect = item === 'bateria' ? `estado_bateria_item` : `estado_${item}`;
    const selectEstado = document.querySelector(`select[name="${nombreSelect}"]`);
    const inputObs = document.getElementById(`obs_${item}`);

    if (valor === "No") {
        if (selectEstado) { selectEstado.disabled = true; selectEstado.value = "Bueno"; selectEstado.classList.add("bloqueado"); }
        if (inputObs) { inputObs.disabled = true; inputObs.value = ""; inputObs.classList.add("bloqueado"); }
    } else {
        if (selectEstado) { selectEstado.disabled = false; selectEstado.classList.remove("bloqueado"); }
        if (inputObs) { inputObs.disabled = false; inputObs.classList.remove("bloqueado"); }
    }
    actualizarBarraProgreso();
};

// ============================================================================
// BÚSQUEDA (Optimizada con AbortController)
// ============================================================================
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colab');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');

async function realizarBusqueda(cedula, tipo) {
    if(!cedula || cedula.trim() === "") return mostrarNotificacion("Por favor ingrese una cédula válida", 'warning');
    
    if (abortControllers[tipo]) abortControllers[tipo].abort();
    abortControllers[tipo] = new AbortController();
    const signal = abortControllers[tipo].signal;

    const sufijo = tipo === 'colab' ? 'colaborador' : 'analista';
    const msg = document.getElementById(`msg-${sufijo}`);
    const icono = document.getElementById(`icono-busqueda-${sufijo}`);
    
    actualizarIndicadorConexion('verificando');
    alternarSkeleton(tipo, true);
    
    icono.innerHTML = '<span class="spinner spinner-colored"></span>'; 
    msg.innerText = `Consultando datos en base de datos...`; 
    msg.style.color = "var(--text-muted)";

    try {
        const resp = await fetch(URL_BUSQUEDA, {
            method: "POST", 
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ cedula: cedula.trim() }),
            signal
        });
        
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        const data = await resp.json();
        alternarSkeleton(tipo, false);
        icono.innerHTML = "🔍";
        actualizarIndicadorConexion('conectado');

        if (data && data.nombre_colaborador) {
            msg.innerText = "✅ Información encontrada"; 
            msg.style.color = "var(--success)";
            
            const rellenar = (id, val) => {
                const el = document.getElementById(id);
                if (el && val) { el.value = val; el.classList.add('campo-completado'); setTimeout(() => el.classList.remove('campo-completado'), 1000); }
            };

            if(tipo === 'colab') {
                rellenar('nombre_colaborador', data.nombre_colaborador); rellenar('agencia', data.agencia); rellenar('telefono', data.telefono);
            } else {
                rellenar('nombre_analista', data.nombre_colaborador); rellenar('agencia_analista', data.agencia); rellenar('telefono_analista', data.telefono);
                rellenar('codigo_sap_analista', data.codigo_sap); rellenar('cargo_analista', data.cargo); rellenar('zona_analista', data.zona);
            }
            guardarDatosLocales();
            actualizarBarraProgreso();
            mostrarNotificacion("Datos cargados exitosamente", 'success');
        } else {
            msg.innerText = "❌ Cédula no registrada"; msg.style.color = "var(--error)";
            mostrarNotificacion("No se encontró información para esta cédula", 'error');
        }
    } catch (err) {
        if (err.name === 'AbortError') return; 
        console.error("Error en búsqueda:", err);
        alternarSkeleton(tipo, false);
        icono.innerHTML = "🔍";
        msg.innerText = "❌ Error de conexión"; msg.style.color = "var(--error)";
        actualizarIndicadorConexion('offline');
        mostrarNotificacion("Revisa tu conexión e intenta de nuevo.", 'error');
    }
}

// ============================================================================
// FIRMAS MODERNIZADAS (PointerEvent, High-DPI y Spline Activo)
// ============================================================================
function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext("2d", { willReadFrequently: true }); 
    let drawing = false;
    let wasUsed = false;
    let imageData = null;
    let points = [];
    
    const resize = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        if (wasUsed && c.width > 0) imageData = ctx.getImageData(0, 0, c.width, c.height);
        
        c.width = c.offsetWidth * ratio; 
        c.height = 150 * ratio;
        ctx.scale(ratio, ratio); 
        
        if (imageData) ctx.putImageData(imageData, 0, 0);
    };
    
    new ResizeObserver(() => resize()).observe(c);
    resize();

    const drawLine = (p1, p2, pressure = 0.5) => {
        const width = 1.2 + (pressure * 1.5);
        ctx.strokeStyle = "rgba(10, 10, 10, 0.95)";
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    };

    const getPos = (e) => {
        const rect = c.getBoundingClientRect();
        return { 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top,
            pressure: e.pressure !== 0.5 && e.pressure > 0 ? e.pressure : 0.5 
        };
    };

    const start = (e) => {
        e.preventDefault();
        drawing = true; wasUsed = true;
        points = [getPos(e)];
        c.classList.add('canvas-firmando');
        mostrarMensajeFirma(c.parentElement, true);
    };
    
    const move = (e) => {
        if(!drawing) return;
        e.preventDefault();
        const currentPos = getPos(e);
        points.push(currentPos);
        
        if(points.length > 1) {
            drawLine(points[points.length-2], currentPos, currentPos.pressure);
        }
    };
    
    const end = (e) => { 
        if (!drawing) return;
        e.preventDefault();
        drawing = false;
        c.classList.remove('canvas-firmando');
        mostrarMensajeFirma(c.parentElement, false);
        mostrarCheckFirma(c.parentElement);
        actualizarBarraProgreso();
    };

    c.style.touchAction = "none";
    c.addEventListener("pointerdown", start); 
    c.addEventListener("pointermove", move); 
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("pointerout", end);
    
    return {
        c, ctx, 
        isSigned: () => wasUsed, 
        reset: () => { 
            wasUsed = false; drawing = false; imageData = null; points = [];
            ctx.clearRect(0, 0, c.width, c.height);
            quitarCheckFirma(c.parentElement); 
        }
    };
}

function mostrarMensajeFirma(c, mostrar) {
    let msg = c.querySelector('.msg-firmando');
    if (mostrar && !msg) {
        c.insertAdjacentHTML('beforeend', '<div class="msg-firmando">Firmando...</div>');
    } else if (!mostrar && msg) msg.remove();
}
function mostrarCheckFirma(c) {
    if (!c.querySelector('.firma-check')) c.insertAdjacentHTML('beforeend', '<div class="firma-check">✓</div>');
}
function quitarCheckFirma(c) { c.querySelector('.firma-check')?.remove(); }
window.limpiarFirma = (quien) => {
    (quien === 'colab' ? sigColab : sigAna).reset();
    actualizarBarraProgreso();
};

// ============================================================================
// VALIDACIONES Y ENVÍO
// ============================================================================
function validarFormulario() {
    const errores = [];
    const val = (id) => document.getElementById(id).value.trim();
    
    if (!val("serial")) errores.push("El SERIAL es obligatorio.");
    if (!sigColab.isSigned()) errores.push("La firma de quien RECIBE es obligatoria.");
    
    const req = [
        { id: 'cedula', n: 'Cédula' }, { id: 'nombre_colaborador', n: 'Nombre' },
        { id: 'correo_colaborador', n: 'Correo' }, { id: 'operacion', n: 'Cargo' },
        { id: 'marca', n: 'Marca' }, { id: 'modelo', n: 'Modelo' }
    ];
    
    req.forEach(c => { if (!val(c.id)) errores.push(`El campo "${c.n}" es obligatorio.`); });
    return errores;
}

document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (enviandoFormulario) return mostrarNotificacion("Procesando, por favor espere...", 'warning');

    const errores = validarFormulario();
    if (errores.length > 0) {
        mostrarNotificacion("Por favor revise los errores.", 'error');
        errores.forEach((err, i) => setTimeout(() => mostrarNotificacion(err, 'error'), i * 150));
        return;
    }

    const valRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "No";
    const valSelect = (name) => { const el = document.querySelector(`select[name="${name}"]`); return el.disabled ? "Bueno" : el.value; };
    const valInput = (id) => { const el = document.getElementById(id); return el.disabled ? "" : el.value.trim(); };

    const data = {
        cedula: valInput("cedula"), nombre_colaborador: valInput("nombre_colaborador"), agencia: valInput("agencia"),
        telefono: valInput("telefono"), correo_colaborador: valInput("correo_colaborador"), codigo_sap: valInput("codigo_sap"),
        zona_colaborador: valInput("zona_colaborador"), operacion: valInput("operacion"), ciudad: valInput("ciudad"),
        fecha: valInput("fecha"), tipo_equipo: "Handheld", marca: valInput("marca"), modelo: valInput("modelo"), serial: valInput("serial"),
        
        entrega_terminal: valRadio("entrega_terminal"), estado_terminal: valSelect("estado_terminal"), obs_terminal: valInput("obs_terminal"),
        entrega_pantalla: valRadio("entrega_pantalla"), estado_pantalla: valSelect("estado_pantalla"), obs_pantalla: valInput("obs_pantalla"),
        entrega_estuche: valRadio("entrega_estuche"), estado_estuche: valSelect("estado_estuche"), obs_estuche: valInput("obs_estuche"),
        entrega_bateria: valRadio("entrega_bateria"), estado_bateria: valSelect("estado_bateria_item"), obs_bateria: valInput("obs_bateria"),
        entrega_cargador: valRadio("entrega_cargador"), estado_cargador: valSelect("estado_cargador"), obs_cargador: valInput("obs_cargador"),
        entrega_cable: valRadio("entrega_cable"), estado_cable: valSelect("estado_cable"), obs_cable: valInput("obs_cable"),
        entrega_sim: valRadio("entrega_sim"), estado_sim: valSelect("estado_sim"), obs_sim: valInput("obs_sim"),
        
        accesorios_adicionales: valInput("accesorios_adicionales"), observaciones: valInput("observaciones"),
        cedula_analista: valInput("cedula_analista"), nombre_analista: valInput("nombre_analista"), agencia_analista: valInput("agencia_analista"),
        telefono_analista: valInput("telefono_analista"), codigo_sap_analista: valInput("codigo_sap_analista"), cargo_analista: valInput("cargo_analista"),
        zona_analista: valInput("zona_analista"),
        firma_colaborador: sigColab.c.toDataURL().split(",")[1], firma_analista: sigAna.isSigned() ? sigAna.c.toDataURL().split(",")[1] : ""
    };
    
    if (!(await mostrarPreview(data))) return mostrarNotificacion("Envío cancelado", 'info');
    
    enviandoFormulario = true;
    const btnEnviar = document.querySelector('.btn-principal');
    const estadoDiv = document.getElementById("estado-envio");
    
    btnEnviar.disabled = true; btnEnviar.classList.add('btn-enviando');
    estadoDiv.innerHTML = '<span class="spinner"></span> Generando y conectando con Power Automate...';

    try {
        const resp = await fetch(URL_ENVIO, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
        if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        estadoDiv.innerHTML = "✅ ¡Acta enviada exitosamente!";
        estadoDiv.style.color = "var(--success)";
        mostrarNotificacion("Acta generada y enviada correctamente", 'success');
        lanzarConfeti();
        borrarDatosLocales();
        
        setTimeout(() => {
            document.getElementById("formulario").reset();
            limpiarFirma('colab'); limpiarFirma('ana');
            configurarFechaActual();
            ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
            enviandoFormulario = false; btnEnviar.disabled = false; btnEnviar.classList.remove('btn-enviando');
            estadoDiv.innerHTML = ""; actualizarBarraProgreso();
        }, 3500);
        
    } catch(err) {
        console.error(err);
        estadoDiv.innerHTML = "❌ Error al enviar. Verifique la conexión."; estadoDiv.style.color = "var(--error)";
        mostrarNotificacion("Error al conectar con el servidor", 'error');
        enviandoFormulario = false; btnEnviar.disabled = false; btnEnviar.classList.remove('btn-enviando');
    }
});

// Entradas y Eventos Generales
const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");
const serialValido = e => e.target.value = e.target.value.replace(/[^A-Za-z0-9\-_]/g, "").toUpperCase();

['cedula', 'cedula_analista', 'codigo_sap_analista', 'codigo_sap'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", soloNumeros);
});
document.getElementById("serial").addEventListener("input", serialValido);

const checkLen = (id, minLen) => {
    const el = document.getElementById(id);
    el.addEventListener("input", function() { this.classList.toggle('campo-completado', this.value.length >= minLen); this.classList.remove('campo-error'); });
    el.addEventListener("blur", function() { if(this.value.length > 0 && this.value.length < minLen) this.classList.add('campo-error'); });
};
checkLen("cedula", 7); checkLen("serial", 5);

document.getElementById("correo_colaborador").addEventListener("blur", function() {
    const correo = this.value.trim();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        this.classList.add('campo-error'); this.classList.remove('campo-completado');
        mostrarNotificacion("Correo inválido (use @ y dominio)", 'warning');
    } else if (correo) {
        this.classList.add('campo-completado'); this.classList.remove('campo-error');
    }
});
