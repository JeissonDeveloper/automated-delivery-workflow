const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

let sigColab, sigAna;

document.addEventListener("DOMContentLoaded", () => {
    // Fecha local automática
    document.getElementById("fecha").value = new Date().toLocaleDateString('sv-SE');

    // IMEI automático (SOTI)
    const params = new URLSearchParams(window.location.search);
    if(params.has("serial")) {
        document.getElementById("serial").value = params.get("serial");
    }

    // Inicializar Firmas
    sigColab = setupFirma("canvas_colaborador");
    sigAna = setupFirma("canvas_analista");

    // Init Estado Accesorios
    ['terminal', 'pantalla', 'estuche', 'bateria', 'cargador', 'cable', 'sim'].forEach(t => toggleAcc(t));

    document.getElementById("formulario").addEventListener("submit", enviarActa);
});

function toggleAcc(item) {
    const rad = document.querySelector(`input[name="entrega_${item}"]:checked`);
    if(!rad) return;
    const sel = document.getElementById(`estado_${item}`);
    if(rad.value === "No") {
        if(sel) { sel.disabled = true; sel.classList.add("bloqueado"); }
    } else {
        if(sel) { sel.disabled = false; sel.classList.remove("bloqueado"); }
    }
}

async function buscarData(tipo) {
    const cedula = tipo === 'colab' ? document.getElementById("cedula").value : document.getElementById("cedula_analista").value;
    const msg = document.getElementById("msg-" + tipo);
    if(!cedula) return;
    msg.innerText = "⏳ Buscando...";

    try {
        const resp = await fetch(`${URL_BUSQUEDA}&v=${Date.now()}`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ cedula: cedula.trim() })
        });
        const data = await resp.json();
        if(data && data.nombre_colaborador) {
            msg.innerText = "✅ Información encontrada";
            if(tipo === 'colab') {
                document.getElementById("nombre_colaborador").value = data.nombre_colaborador;
                document.getElementById("agencia").value = data.agencia || "";
                document.getElementById("telefono").value = data.telefono || "";
            } else {
                document.getElementById("nombre_analista").value = data.nombre_colaborador;
                document.getElementById("agencia_analista").value = data.agencia || "";
                document.getElementById("telefono_analista").value = data.telefono || "";
                if(data.codigo_sap) document.getElementById("sap_analista").value = data.codigo_sap;
                if(data.cargo) document.getElementById("cargo_analista").value = data.cargo;
                if(data.zona) document.getElementById("zona_analista").value = data.zona;
            }
        } else { msg.innerText = "❌ Cédula no encontrada"; }
    } catch(e) { msg.innerText = "⚠️ Error de conexión"; }
}

function setupFirma(id) {
    const can = document.getElementById(id);
    const ctx = can.getContext("2d");
    let drawing = false;

    const getPos = (e) => {
        const rect = can.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => {
        document.activeElement.blur(); // Ocultar teclado
        drawing = true;
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        e.preventDefault();
    };

    const move = (e) => {
        if(!drawing) return;
        const p = getPos(e);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        e.preventDefault();
    };

    can.addEventListener("touchstart", start, {passive: false});
    can.addEventListener("touchmove", move, {passive: false});
    can.addEventListener("touchend", () => drawing = false);
    return {
        clear: () => ctx.clearRect(0, 0, can.width, can.height),
        isEmpty: () => can.toDataURL() === document.createElement('canvas').toDataURL(),
        getData: () => can.toDataURL().split(',')[1]
    };
}

function limpiarFirma(t) { t === 'colab' ? sigColab.clear() : sigAna.clear(); }

async function enviarActa(e) {
    e.preventDefault();
    if(sigColab.isEmpty()) { alert("La firma de quien recibe es obligatoria."); return; }
    const btn = document.getElementById("btn-submit");
    const status = document.getElementById("envio-status");
    btn.disabled = true; btn.innerText = "ENVIANDO...";
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.firma_colaborador = sigColab.getData();
    data.firma_analista = sigAna.getData();

    try {
        const resp = await fetch(URL_ENVIO, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(data)
        });
        if(resp.ok) {
            status.innerHTML = "<b style='color:green'>✅ ENVIADO CON ÉXITO</b>";
            setTimeout(() => location.reload(), 3000);
        } else { throw new Error(); }
    } catch(err) {
        btn.disabled = false; btn.innerText = "GENERAR ACTA";
        status.innerHTML = "<b style='color:red'>❌ ERROR AL ENVIAR</b>";
    }
}
