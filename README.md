# SUBE · Herramienta de diseño de subestaciones

Proyecto final de **Subestaciones Eléctricas 2026-2**, Escuela Colombiana de Ingeniería Julio Garavito.

Página web para diseñar y estudiar subestaciones de alta tensión. Sirve para cualquier subestación (de 3,6 a 800 kV); el **caso base** que trae cargado es la **S/E Termales 115 kV** del curso, y con un botón se vuelve a él.

## Módulos

1. **Coordinación de aislamiento** (IEC 60071, IEC 60815): selección del BIL con el pararrayos, en rango I y rango II, y cadena de aisladores por contaminación. Pararrayos de catálogo (Siemens Energy, ABB / Hitachi Energy, GE Vernova) o personalizados.
2. **Conductores y barrajes** (IEEE 738, Peek, IEC 60865-1): capacidad de corriente, efecto corona, cortocircuito térmico y fuerzas, flecha del vano y tubo rígido.
3. **Distancias eléctricas** (método del curso, RETIE vigente, IEC 60071-2): distancias mínimas, de seguridad y de diseño, con corte de la bahía a escala.
4. **Malla de puesta a tierra** (IEEE Std 80-2013): tensiones de toque y de paso, cálculo del factor de reparto Sf con los cables de guarda y tabla de sensibilidad de los supuestos.
5. **Apantallamiento** (IEEE Std 998): corriente crítica, distancia de descarga y zona protegida por los cables de guarda.
6. **Configuraciones**: comparación de siete esquemas de barras (barra sencilla, principal + transferencia, doble barra, doble barra + transferencia, anillo, interruptor y medio, doble interruptor).
7. **Simulador 3D**: maniobras con enclavamientos, unifilar con flujo de carga y patio en 3D (modelado para el caso base).
8. **Validación**: el mismo motor resuelve ejemplos publicados (IEEE 80 Anexo B, IEEE 738, apuntes del curso, entregas 1 y 2) y muestra la diferencia.

Cada módulo muestra la memoria de cálculo paso a paso. En el resumen se puede crear un proyecto nuevo, guardarlo en un archivo `.json` y volver a abrirlo.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La herramienta: resumen, aislamiento, distancias, malla y normas |
| `modulos.js` | Proyecto, conductores, apantallamiento, configuraciones, validación y resumen |
| `calculos.js` | Motor de cálculo que comparten las dos páginas |
| `catalogos.js` | Datos de catálogo: pararrayos, aisladores y conductores, con sus fuentes |
| `simulador.html` | Simulador de maniobras y patio 3D |
| `img/logo-eci.png` | Logo de la universidad |

No necesita servidor ni instalación: son archivos estáticos que funcionan en GitHub Pages. Para actualizar el sitio se reemplazan estos archivos en el repositorio.

## Catálogos y fuentes

- Pararrayos Siemens Energy: *High-voltage surge arresters · Product guide* (2021).
- Pararrayos ABB / Hitachi Energy: *High Voltage Surge Arresters · Buyer's Guide*, ed. 14 (2018), series PEXLIM.
- Pararrayos GE Vernova: *TRANQUELL Surge Arresters · Product Selection Guide* (2025).
- Aisladores poliméricos Siemens 3FL y discos de vidrio típicos (IEC 60305).
- Conductores ACSR: ficha técnica FT-ACSR, Prysmian / Procables Colombia.

Los valores son los de la edición citada; confirme siempre con la ficha vigente del fabricante. Para cualquier otro equipo, cada módulo tiene la opción «Personalizado».

## Normas

RETIE (Resolución 40117 de 2024, modificada por la Resolución 40284 de 2026), IEC 60071-1/2, IEC 60099-4/5, IEC 60815, IEC 60865-1, IEC 60909, IEEE Std 80-2013, IEEE Std 738, IEEE Std 998.

## Equipo

Subestaciones Eléctricas 2026-2 · Docente: E.E. MSc. Javier Andrés Ruiz Garzón

| Grupo 1 | Grupo 2 | Grupo 3 | Grupo 4 |
|---|---|---|---|
| Julian Rubiano | Juan Guillermo Nuñez | <u>Camilo Andrés Palomar</u> | Ingrid Quiroga |
| <u>Óscar Julián Limas</u> | Diego Andres Cely | Daniel Andrés Chávez | Andres Coa |
| Danna Guerrero | Juan Diego García | María Fernanda Chala | Yuli Leon |
| Michael Duarte | Stiven Montaño | Marlon Nivia | |
| <u>Ángel Daniel Cepeda</u> | David Durán | <u>Santiago Alfonso Tinoco</u> | |

Autores de la herramienta (subrayados): Ángel Daniel Cepeda (aislamiento), Óscar Julián Limas (distancias), Camilo Andrés Palomar (malla de puesta a tierra) y Santiago Alfonso Tinoco (simulador 3D e integración).
