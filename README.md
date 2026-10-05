# Crypto Control - estructura inicial

Dashboard web estático para visualizar la cartera de Fiwind.

## Carpetas
- `index.html`: interfaz principal.
- `css/styles.css`: diseño.
- `js/app.js`: cálculos y visualización.
- `data/portfolio.json`: balance, promedios y conversiones procesadas del Excel.

## Ejecutar localmente
Por seguridad del navegador, abrir con un servidor local desde esta carpeta, por ejemplo `python -m http.server 8000`, y visitar `http://localhost:8000`.

## Próximos pasos
1. Auditar costo promedio real por activo incluyendo ventas/conversiones.
2. Conectar API pública de cotizaciones.
3. Incorporar niveles personalizados configurables.
4. Guardar snapshots diarios e historial.
5. Publicar en GitHub Pages sin subir el Excel original.

> No incluye credenciales de Fiwind ni capacidad de operar fondos.
