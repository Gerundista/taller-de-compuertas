#!/usr/bin/env bash
# Une page.html + core.js + tabla.js + ui.js en ../index.html (un solo archivo, funciona sin internet)
set -euo pipefail
cd "$(dirname "$0")"
ICON='<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22%3E%3Crect width=%22128%22 height=%22128%22 rx=%2224%22 fill=%22%23141920%22/%3E%3Cpath d=%22M14 48H40M14 80H40%22 stroke=%22%23E6EAF0%22 stroke-width=%226%22 stroke-linecap=%22round%22/%3E%3Cpath d=%22M40 30H62A34 34 0 0 1 62 98H40Z%22 fill=%22%23141920%22 stroke=%22%23E6EAF0%22 stroke-width=%226%22/%3E%3Ccircle cx=%22103%22 cy=%2264%22 r=%226%22 fill=%22%23141920%22 stroke=%22%23E6EAF0%22 stroke-width=%225%22/%3E%3Cpath d=%22M109 64H118%22 stroke=%22%23FFB21E%22 stroke-width=%226%22 stroke-linecap=%22round%22/%3E%3C/svg%3E">'
{
  echo '<!doctype html>'
  echo '<html lang="es">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo "$ICON"
  sed -n '1,/^<\/style>/p' page.html
  echo '</head>'
  echo '<body>'
  sed '1,/^<\/style>/d' page.html
  echo '<script>'; cat core.js tabla.js ui.js; echo '</script>'
  echo '</body>'
  echo '</html>'
} > ../index.html
echo "Listo: index.html actualizado ($(wc -c < ../index.html) bytes)"
