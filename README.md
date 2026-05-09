# Analog Filter Designer Pro 🚀

Una potente herramienta web multiplataforma (PWA) diseñada para ingenieros electrónicos y estudiantes, enfocada en el diseño, cálculo y simulación analítica de filtros analógicos activos (Topología Sallen-Key). 

Esta aplicación traslada la potencia de un motor de síntesis de filtros escrito originalmente en Python hacia un entorno **Web/Móvil 100% interactivo**, utilizando HTML5, CSS3 moderno (Glassmorphism) y JavaScript puro.

![Sallen-Key Designer](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Tech-HTML5%20|%20CSS3%20|%20Vanilla%20JS-blue?style=flat-square)

## ✨ Características Principales

* 🧮 **Motor Matemático Avanzado:** Cálculo de filtros LPF de **2do y 4to Orden** con precisión de punto flotante de 6 decimales.
* 📈 **Simulación Bode en Tiempo Real:** Renderizado interactivo de Magnitud (dB) y Fase (°) usando `Chart.js`, con doble eje Y, capacidades de *pan & zoom* precisas y un algoritmo de *unwrapping* de fase.
* 📐 **Renderizado Vectorial Integrado:** Motor propietario que genera esquemáticos SVG dinámicos y sin solapamiento (basados en topología de ingeniería estricta), mostrando valores comerciales reales en pantalla.
* 🔌 **Exportación Profesional SPICE:** 
  * Generación de *Netlist Ideal* (con fuentes dependientes de voltaje de alta ganancia).
  * Generación de *Netlist Práctico (TL081)* listo para simularse en **TopSpice** o herramientas compatibles (con directivas `.AC`, `.PROBE`, y fuentes `VCC/VEE` incluidas).
* 🎨 **UI/UX Premium (Mobile First):** Interfaz fluida con *Glassmorphism*, diseño responsivo, interruptores y soporte nativo táctil para la simulación en campo desde cualquier teléfono celular o tablet.
* 📚 **Plantillas Rápidas:** Soporte directo para familias polinomiales de filtros clásicos (Butterworth, Bessel, Chebyshev).

## 🛠️ Estructura del Proyecto

La herramienta Sallen-Key está dividida bajo principios de responsabilidad única (Separation of Concerns):

* `sallen_key.html`: Estructura principal, integración de plugins (Chart.js, Hammer.js, Chartjs-Plugin-Zoom) y manejo de las pestañas dinámicas.
* `sallen_key.css`: Sistema de diseño basado en variables, tarjetas traslúcidas (backdrop-filter) y esquemas de colores oscuros adaptables.
* `sallen_key.js`: El corazón matemático. Contiene los resolvedores algebraicos de Sallen-Key, formateadores de ingeniería (`k`, `µ`, `M`, etc.), la generación de strings SPICE y el dibujado vectorial SVG.

## 🚀 Uso

Al ser una aplicación basada integramente en el cliente (Front-end), **no requiere instalación ni servidor**.

1. Clona este repositorio o descarga los archivos.
2. Abre `sallen_key.html` en cualquier navegador web moderno (Chrome, Firefox, Safari, Edge).
3. Introduce tu Frecuencia de Corte, selecciona el tipo de filtro, escoge qué capacitor comercial posees y presiona **Calcular Circuito**.
4. ¡Listo! Visualiza el esquema, interactúa con la gráfica de Bode y copia tu código SPICE a tu simulador favorito.

## 🤝 Contribuciones
¡Las sugerencias y *pull requests* son siempre bienvenidos! Si deseas añadir topologías High-Pass, Band-Pass, o incluir modelos macro de otros OpAmps genéricos, siéntete libre de colaborar.

---
*Desarrollado con pasión para facilitar la ingeniería.*
