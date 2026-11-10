#!/usr/bin/env bash
# Taller de Compuertas — instalador para Fedora (GNOME, KDE u otro escritorio)
# Copia el programa a tu carpeta de usuario y lo agrega al menú de aplicaciones.
# No necesita sudo ni internet. Para quitarlo:  bash instalar-fedora.sh --desinstalar
set -euo pipefail

DEST="$HOME/.local/share/taller-compuertas"
LANZADOR="$HOME/.local/share/applications/taller-compuertas.desktop"

if [[ "${1:-}" == "--desinstalar" ]]; then
  rm -rf "$DEST" "$LANZADOR"
  update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
  echo "Taller de Compuertas se quitó del menú."
  exit 0
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$DIR/index.html"
[[ -f "$SRC" ]] || SRC="$DIR/taller-de-compuertas.html"
if [[ ! -f "$SRC" ]]; then
  echo "No encuentro index.html. Ejecuta este script dentro de la carpeta del proyecto."
  exit 1
fi

mkdir -p "$DEST" "$HOME/.local/share/applications"
cp "$SRC" "$DEST/index.html"

cat > "$DEST/icono.svg" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#141920"/>
  <path d="M14 48H40M14 80H40" stroke="#E6EAF0" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 30H62A34 34 0 0 1 62 98H40Z" fill="#141920" stroke="#E6EAF0" stroke-width="6" stroke-linejoin="round"/>
  <circle cx="103" cy="64" r="6" fill="#141920" stroke="#E6EAF0" stroke-width="5"/>
  <path d="M109 64H118" stroke="#FFB21E" stroke-width="6" stroke-linecap="round"/>
</svg>
SVG

cat > "$LANZADOR" <<EOF
[Desktop Entry]
Type=Application
Name=Taller de Compuertas
Comment=Practica tablas de verdad, mapas de Karnaugh y álgebra booleana
Exec=xdg-open "$DEST/index.html"
Icon=$DEST/icono.svg
Terminal=false
Categories=Education;Science;Electronics;
Keywords=logica;compuertas;karnaugh;booleana;tabla de verdad;
EOF
chmod +x "$LANZADOR"
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo "Listo. Busca «Taller de Compuertas» en Actividades o en el menú de aplicaciones."
echo "También puedes abrirlo directo con:  xdg-open \"$DEST/index.html\""
