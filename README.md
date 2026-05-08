# Formulario de Entrega de Dispositivos Móviles - RAMO

Sistema web optimizado para la gestión y documentación de entregas de dispositivos móviles (Handhelds Zebra, Ulefone) a colaboradores de la organización RAMO.

Version: 2.3
Licencia: Privada (Uso interno)
Estado: Producción

## Descripción

Aplicación web de alto rendimiento que automatiza el proceso de entrega de dispositivos móviles mediante un formulario digital. Está específicamente optimizado para hardware de gama media (Zebra TC26/TC27) y entornos controlados por MDM (SOTI MobiControl).

- Búsqueda instantánea de colaboradores con caché en memoria.
- Integración nativa con SOTI MobiControl (Inyección de macros de Serial/IMEI).
- Registro detallado del estado de dispositivos y accesorios.
- Firmas digitales fluidas (Motor PointerEvents de alta compatibilidad).
- Integración con Power Automate para automatización de actas.
- Gestión estricta de Zona Horaria (Colombia UTC-5).

## Características Principales

### Gestión de Dispositivos y MDM
- Compatibilidad total con escáneres DataWedge de Zebra.
- Soporte para variables inyectadas en la URL por SOTI MobiControl (?serial=...).
- Control de accesorios: Terminal, Protector de pantalla, Estuche, Batería, Cargador, Cable USB, SIM Card.

### Búsqueda Inteligente (Caché Local)
- Búsqueda de colaboradores por número de cédula.
- Sistema de caché temporal: Evita el consumo doble de datos móviles si se consulta la misma cédula por error, devolviendo el resultado en 0 milisegundos.

### Firmas Digitales Optimizadas
- Firma del colaborador (obligatoria) y analista (opcional).
- Motor de dibujo restaurado para máxima estabilidad en navegadores WebView/SOTI Surf.
- Soporte Multi-Touch y Stylus.

### Seguridad y Validaciones
- Bloqueo de envíos dobles.
- Validación estricta de formato de correo (Dominio corporativo Ramo).
- Forzado de zona horaria America/Bogota para evitar desfases de calendario en turnos nocturnos.

## Tecnologías

- Frontend: HTML5, CSS3 (Variables nativas, UI 2026), JavaScript ES6.
- Backend: Microsoft Power Automate.
- MDM Target: SOTI MobiControl / Enterprise Home Screen (Zebra).
- Almacenamiento: Caché en memoria y localStorage.

## Estructura del Proyecto

```text
formulario-entrega-ramo/
|
|-- index.html          # Estructura del formulario y UI principal
|-- estilos.css         # Estilos corporativos (Azul Ramo / Rojo) y Responsive
|-- script.js           # Logica de aplicacion, SOTI, Cache y Canvas API
|-- logo-ramo.png       # Logo corporativo optimizado
|-- README.md           # Documentacion del proyecto
