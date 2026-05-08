// ============================================================================
// JS OPTIMIZADO - RAMO v2.1 (Búsqueda Caché + Curvas Perfectas de Firma)
// ============================================================================

const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

let sigColab, sigAna;
let enviandoFormulario = false;

// 1. SISTEMA DE CACHÉ PARA BÚSQUEDAS ULTRA RÁPIDAS
const cacheBusquedas = {}; 

function mostrarNotificacion(mensaje) {
    alert(mensaje); // Fallback nativo ultra-rápido para TC26, consume 0 recursos gráficos
}

function actualizarBarraProgreso() { /* Omitido visual para mejor rendimiento en Android gama media, enfocado en fluidez de formulario */ }

function mostrarPreview(datos) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-preview-overlay';
        modal.innerHTML = `
            <div class="modal-preview-content">
                <h2 style="color:var(--primary); margin-top:0;">Confirmar Envío</h2>
                <div style="background:#f1f5f8; padding:15px; border-radius:8px; margin:15px 0;">
                    <p><strong>Recibe:</strong> ${datos.nombre_colaborador}</p>
                    <p><strong>Cédula:</strong> ${datos.cedula}</p>
                    <p><strong>Equipo:</strong> ${datos.marca} ${datos.modelo}</p>
                    <p><strong>Serial:</strong> ${datos.serial}</p>
                </div>
                <div class="modal-preview-buttons">
                    <button id="btn-cancelar-preview">Cancelar</button>
                    <button id="btn-confirmar-preview">✓ Enviar</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('btn-cancelar-preview').onclick = () => { modal.remove(); resolve(false); };
        document.getElementById('btn-confirmar-preview').onclick = () => { modal.remove(); resolve(true); };
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const hoy = new Date().toLocaleString("en-US", {timeZone: "America/Bogota"});
    document.getElementById("fecha").value = new Date(hoy).toISOString().split('T')[0];
    
    sigColab = setupCanvas("canvas_colaborador");
    sigAna = setupCanvas("canvas_analista");
    ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(item => toggleAccesorio(item));
});

window.toggleAccesorio = (item) => {
    const valor = document.querySelector(`input[name="entrega_${item}"]:checked`)?.value || "No";
    const selectEstado = document.querySelector(`select[name="estado_${item === 'bateria' ? 'bateria_item' : item}"]`);
    const inputObs = document.getElementById(`obs_${item}`);

    if (valor === "No") {
        if (selectEstado) { selectEstado.disabled = true; selectEstado.value = "Bueno"; }
        if (inputObs) { inputObs.disabled = true; inputObs.value = ""; }
    } else {
        if (selectEstado) selectEstado.disabled = false;
        if (inputObs) inputObs.disabled = false;
    }
};

// ============================================================================
// LÓGICA DE BÚSQUEDA ACELERADA
// ============================================================================
window.buscarColaborador = () => realizarBusqueda(document.getElementById("cedula").value, 'colab');
window.buscarAnalista = () => realizarBusqueda(document.getElementById("cedula_analista").value, 'analista');

async function realizarBusqueda(cedula, tipo) {
    if(!cedula) return;
    const cleanCedula = cedula.trim();
    const sufijo = tipo === 'colab' ? 'colaborador' : 'analista';
    const msg = document.getElementById(`msg-${sufijo}`);
    
    // 2. MAGIA DE CACHÉ: Responde instantáneo si ya se buscó hoy en esta pestaña
    if (cacheBusquedas[cleanCedula]) {
        msg.innerText = "⚡ Datos cargados de memoria local"; msg.style.color = "var(--success)";
        llenarCampos(cacheBusquedas[cleanCedula], tipo);
        return;
    }

    msg.innerText = "Consultando..."; msg.style.color = "var(--text-muted)";

    try {
        const resp = await fetch(URL_BUSQUEDA, {
            method: "POST", headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ cedula: cleanCedula })
        });
        
        if (!resp.ok) throw new Error();
        const data = await resp.json();

        if (data && data.nombre_colaborador) {
            msg.innerText = "✅ Información encontrada"; msg.style.color = "var(--success)";
            cacheBusquedas[cleanCedula] = data; // Guardar en caché para la próxima
            llenarCampos(data, tipo);
        } else {
            msg.innerText = "❌ Cédula no registrada"; msg.style.color = "var(--error)";
        }
    } catch (err) {
        msg.innerText = "❌ Error de conexión"; msg.style.color = "var(--error)";
    }
}

function llenarCampos(data, tipo) {
    if(tipo === 'colab') {
        document.getElementById('nombre_colaborador').value = data.nombre_colaborador;
        document.getElementById('agencia').value = data.agencia || "";
        document.getElementById('telefono').value = data.telefono || "";
    } else {
        document.getElementById('nombre_analista').value = data.nombre_colaborador;
        document.getElementById('agencia_analista').value = data.agencia || "";
        document.getElementById('telefono_analista').value = data.telefono || "";
        if(data.codigo_sap) document.getElementById('codigo_sap_analista').value = data.codigo_sap;
        if(data.cargo) document.getElementById('cargo_analista').value = data.cargo;
        if(data.zona) document.getElementById('zona_analista').value = data.zona;
    }
}

// ============================================================================
// FIRMAS CON CURVAS DE BÉZIER CUADRÁTICAS (Trazos armónicos)
// ============================================================================
function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext("2d", { desynchronized: true }); // Acelera renderizado en Chrome Android
    let drawing = false, wasUsed = false;
    let points = [];
    
    const resize = () => {
        c.width = c.offsetWidth; 
        c.height = 160; 
    };
    window.addEventListener("resize", resize);
    resize();

    const getPos = (e) => {
        const rect = c.getBoundingClientRect();
        const ev = e.touches ? e.touches[0] : e;
        // Simulamos presión para el grosor si el hardware no lo soporta
        return { x: ev.clientX - rect.left, y: ev.clientY - rect.top, pressure: 0.6 };
    };

    const start = (e) => {
        e.preventDefault();
        drawing = true; wasUsed = true;
        points = [getPos(e)];
        c.classList.add('canvas-firmando');
    };
    
    const move = (e) => {
        if(!drawing) return;
        e.preventDefault();
        points.push(getPos(e));
        
        // 3. MAGIA DE CURVAS: Solo dibujamos cuando tenemos 3 puntos (Bézier Cuadrática)
        if(points.length >= 3) {
            const p1 = points[points.length - 3];
            const p2 = points[points.length - 2];
            const p3 = points[points.length - 1];

            // Puntos medios para crear el arco de la curva suavizada
            const midX1 = (p1.x + p2.x) / 2;
            const midY1 = (p1.y + p2.y) / 2;
            const midX2 = (p2.x + p3.x) / 2;
            const midY2 = (p2.y + p3.y) / 2;

            ctx.beginPath();
            ctx.moveTo(midX1, midY1);
            ctx.quadraticCurveTo(p2.x, p2.y, midX2, midY2); // <--- Crea curvas fluidas en vez de líneas rotas
            
            ctx.strokeStyle = "rgba(10, 10, 10, 0.9)";
            ctx.lineWidth = 1.2 + (p3.pressure * 2); // Grosor fluido
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }
    };
    
    const end = (e) => { 
        if (!drawing) return;
        drawing = false;
        c.classList.remove('canvas-firmando');
        points = []; // Reset array de puntos para el siguiente trazo
    };

    c.addEventListener("touchstart", start, {passive:false}); c.addEventListener("touchmove", move, {passive:false}); c.addEventListener("touchend", end);
    c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    
    return { c, isSigned: () => wasUsed, reset: () => { wasUsed = false; ctx.clearRect(0, 0, c.width, c.height); } };
}

window.limpiarFirma = (quien) => { (quien === 'colab' ? sigColab : sigAna).reset(); };

// ============================================================================
// VALIDACIÓN Y ENVÍO
// ============================================================================
document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (enviandoFormulario) return;

    if (!document.getElementById("serial").value.trim() || !sigColab.isSigned()) {
        mostrarNotificacion("Revisa: Serial y Firma del Colaborador son obligatorios.");
        return;
    }

    const valInput = (id) => document.getElementById(id).value.trim();
    const valSelect = (name) => document.querySelector(`select[name="${name}"]`).disabled ? "Bueno" : document.querySelector(`select[name="${name}"]`).value;
    const valRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "No";

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
    
    if (!(await mostrarPreview(data))) return;
    
    enviandoFormulario = true;
    const btnEnviar = document.querySelector('.btn-principal');
    document.getElementById("estado-envio").innerHTML = "Enviando acta, no cierre la ventana...";
    btnEnviar.disabled = true;

    try {
        const resp = await fetch(URL_ENVIO, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
        if(!resp.ok) throw new Error();
        
        document.getElementById("estado-envio").innerHTML = "✅ ¡Acta enviada!";
        document.getElementById("estado-envio").style.color = "green";
        
        setTimeout(() => {
            document.getElementById("formulario").reset();
            limpiarFirma('colab'); limpiarFirma('ana');
            enviandoFormulario = false; btnEnviar.disabled = false;
            document.getElementById("estado-envio").innerHTML = "";
        }, 2000);
        
    } catch(err) {
        document.getElementById("estado-envio").innerHTML = "❌ Error al enviar.";
        enviandoFormulario = false; btnEnviar.disabled = false;
    }
});

const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");
const serialValido = e => e.target.value = e.target.value.replace(/[^A-Za-z0-9\-_]/g, "").toUpperCase();

['cedula', 'cedula_analista', 'codigo_sap_analista', 'codigo_sap'].forEach(id => {
    document.getElementById(id)?.addEventListener("input", soloNumeros);
});
document.getElementById("serial").addEventListener("input", serialValido);
