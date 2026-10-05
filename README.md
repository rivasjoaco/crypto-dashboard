# Crypto Control V1.1

Dashboard personal para seguimiento visual de BTC, ETH, SOL, ADA y BNB.

## Novedades

- Vista clara de precio actual vs. promedio.
- Niveles +10% y +20% sobre precio promedio.
- Compras históricas contra USDT/DAI separadas de las salidas.
- Movimientos clasificados como entrada o salida.
- Diseño responsive para celular.

## Estructura

- `index.html`: interfaz.
- `css/styles.css`: diseño.
- `js/app.js`: cálculos y visualización.
- `data/portfolio.json`: datos existentes de la cartera. Este archivo no se reemplaza en esta actualización.

## Funcionamiento actual

Los precios actuales se cargan manualmente.

Una vez cargado un precio, queda almacenado localmente en el dispositivo para poder comparar el mercado contra:

- Precio promedio.
- Break-even.
- Nivel +10%.
- Nivel +20%.
- Compras históricas.

## Importante

Los precios promedio siguen siendo los valores de referencia cargados inicialmente.

La reconstrucción completa del costo de la posición, incluyendo operaciones en ARS y conversiones cripto-cripto, queda para la siguiente iteración.

No incluye credenciales de Fiwind ni capacidad de operar fondos.
