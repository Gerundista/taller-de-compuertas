# Taller de Compuertas

Programa para practicar **tablas de verdad**, **mapas de Karnaugh** y **simplificación con álgebra booleana** de las compuertas AND, NAND, OR, NOR, XOR, XNOR, NOT A, NOT B, Buffer A y Buffer B, con 2, 3 y 4 entradas.

Es un solo archivo HTML: funciona en cualquier navegador, también sin internet.

**Úsalo en línea:** https://TU-USUARIO.github.io/taller-de-compuertas/

## Qué incluye

- **Aprender:** símbolo con interruptores, tabla de verdad, mapa K con grupos, formas canónicas Σm/ΠM, SOP y POS mínimas y simplificación paso a paso.
- **Tabla de verdad:** 7 modos de ejercicio:
  - llenar F (desde compuerta, expresión, Σm o ΠM)
  - resolver por columnas intermedias
  - leer un circuito de varias compuertas
  - comprobar equivalencias (leyes del álgebra)
  - encontrar errores
  - reconocer la compuerta
  - ronda rápida contra reloj
- **Mapa K:** llenar el mapa, formar grupos y escribir la expresión, con revisión en cada paso.
- **Álgebra:** escribir la SOP o POS mínima; se revisa que sea equivalente y que no se pueda simplificar más.
- **Examen:** preguntas al azar de todo el temario.

## Usarlo en Fedora sin internet

```bash
git clone https://github.com/TU-USUARIO/taller-de-compuertas.git
cd taller-de-compuertas
bash instalar-fedora.sh      # lo agrega al menú de aplicaciones
```

O simplemente abre `index.html` con doble clic. Para quitarlo del menú: `bash instalar-fedora.sh --desinstalar`.

## Modificar el código

El código está separado en `src/`:

| Archivo | Contenido |
|---|---|
| `src/page.html` | Estructura y estilos |
| `src/core.js` | Lógica: tablas, minimización Quine–McCluskey, lector de expresiones |
| `src/tabla.js` | Modos de práctica de tablas de verdad |
| `src/ui.js` | Interfaz de Aprender, Mapa K, Álgebra y Examen |

Después de editar, ejecuta `bash src/build.sh` para regenerar `index.html`.
