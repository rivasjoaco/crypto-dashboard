const coins = {
  BTC: 'Bitcoin',
* ETH: 'Ethereum',
  SOL: 'Solana',*  ADA: 'Cardano',
  BNB: 'BNB'
};
*
const fmt = (n, d = 2) =>
  new I*tl.NumberFormat(
    'es-AR',
    *
      minimumFractionDigits: d,
 *    maximumFractionDigits: d
    }*  ).format(n);


const money = n =*
  `USDT ${fmt(n, n < 10 ? 4 : 0)}*;


let D;

let prices = {};


/* *==================================*========= */
/* FECHAS */
/* =====*==================================*==== */

const parseDate = s => {
*  const [d, m, y] =
    s.split('/*);

  return new Date(
    +y,
   *+m - 1,
    +d
  );

};


/* =====*==================================*==== */
/* CLASIFICAR MOVIMIENTOS */
/* =============================*=============== */

function class*fy(t, c) {

  /*
    Si la moneda *ecibida es BTC,
    ETH, SOL, ADA * BNB,
    consideramos una entrada*
  */

  if (t.Moneda === c) {
   *return 'entrada';
  }


  /*
    S* la cripto aparece como
    moneda*de origen,
    significa que salió*de nuestra
    posición.
  */

  i* (t['Moneda Origen'] === c) {
    *eturn 'salida';
  }


  return 'ot*a';

}


/* ======================*====================== */
/* COMPR*S COMPARABLES EN USDT */
/* ======*==================================*=== */

function referenceBuys(c) *

  return D.transactions

    .fi*ter(t =>
      classify(t, c) === *entrada' &&

      [
        'USDT*,
        'DAI'
      ].includes(
*       t['Moneda Origen']
      ) *&

      Number(t.Precio) > 0
    *

    .sort(
      (a, b) =>
     *  parseDate(b.Fecha) -
        par*eDate(a.Fecha)
    );

}


/* ====*==================================*===== */
/* CARGAR CARTERA */
/* =*==================================*======== */

async function load()*{

  D = await fetch(
    'data/po*tfolio.json'
  )
    .then(
      * => r.json()
    );


  Object
   *.keys(D.balances)
    .forEach(c =* {

      prices[c] =
        +(
 *        localStorage.getItem(
    *       'p_' + c
          ) || 0
 *      );

    });


  render();

}*

/* =============================*=============== */
/* RENDER GENER*L */
/* ==========================*================== */

function re*der() {

  let total = 0;

  let c*st = 0;


  for (const c in D.bala*ces) {

    if (prices[c]) {

    * total +=
        D.balances[c] *
*       prices[c];

    }


    cos* +=
      D.balances[c] *
      D.*veragePurchasePrice[c];

  }


  c*nst pnl =
    total
      ? total * cost
      : 0;


  document
    *querySelector('#kpis')
    .innerH*ML = `

      <div class="kpi">

 *      <span>
          Valor actua*
        </span>

        <strong>*          ${
            total
   *          ? money(total)
         *    : 'Cargá precios'
          }
*       </strong>

      </div>


 *    <div class="kpi">

        <sp*n>
          Costo referencia
    *   </span>

        <strong>
     *    ${money(cost)}
        </stron*>

      </div>


      <div class*"kpi">

        <span>
          R*sultado
        </span>

        <*trong class="${
          pnl >= 0*            ? 'green'
            * 'red'
        }">

          ${
 *          total
              ? mo*ey(pnl)
              : '—'
      *   }

        </strong>

      </d*v>


      <div class="kpi">

    *   <span>
          Activos
      * </span>

        <strong>
       *  ${
            Object
          *   .keys(D.balances)
             *.length
          }
        </stro*g>

      </div>

    `;


  docum*nt
    .querySelector('#cards')
  * .innerHTML =

      Object
      * .keys(D.balances)
        .map(ca*d)
        .join('');


  document*    .querySelectorAll(
      'inpu*[data-coin]'
    )
    .forEach(i *> {

      i.onchange = e => {

  *     const coin =
          e.targ*t.dataset.coin;


        prices[c*in] =
          +e.target.value;

*        localStorage.setItem(
    *     'p_' + coin,
          e.targ*t.value
        );


        rende*();

      };

    });

}


/* ===*==================================*====== */
/* TARJETA DE CADA CRIPT* */
/* ===========================*================= */

function car*(c) {

  const p =
    prices[c];
*
  const a =
    D.averagePurchase*rice[c];


  const diff =
    p
  *   ? p / a - 1
      : 0;


  cons* need =
    p
      ? a / p - 1
  *   : 0;


  const buys =
    refer*nceBuys(c);


  /*
    Calculamos *ínimos y máximos
    solamente par* ubicar visualmente
    los puntos*en la barra.
  */

  const vals = *

    a * .8,

    a * .9,

    a,*
    a * 1.1,

    a * 1.2,

    .*.buys.map(
      x => +x.Precio
  * ),

    ...(
      p
        ? [p*
        : []
    )

  ];


  cons* lo =
    Math.min(...vals);


  c*nst hi =
    Math.max(...vals);


* const pos = v =>
    `${
      Ma*h.max(
        2,
        Math.min*
          98,
          (
       *    (v - lo) /
            (hi - l*)
          ) * 100
        )
    * )
    }%`;


  /*
    Armamos los*niveles
    visibles del activo.
 **/

  const rows = [

    {
      *: '+20% promedio',
      v: a * 1.*,
      k: 'up'
    },

    {
    * n: '+10% promedio',
      v: a * *.1,
      k: 'up'
    },

    {
  *   n: 'PROMEDIO / BREAK-EVEN',
   *  v: a,
      k: 'avg'
    },

   *...(
      p
        ? [
         *  {
              n: 'PRECIO ACTUA*',
              v: p,
           *  k: 'current'
            }
     *    ]
        : []
    ),

    ...*uys
      .slice(0, 12)
      .map*x => ({

        n:
          `Com*ra · ${x.Fecha}`,

        v:
    *     +x.Precio,

        k:
      *   'buy'

      }))

  ];


  rows*sort(
    (x, y) =>
      y.v - x.*
  );


  return `

    <article c*ass="asset">


      <div class="a*set-head">


        <div>

      *   <div class="coin">
            *{c} · ${coins[c]}
          </div>*
          <div class="holding">

*           ${
              fmt(
 *              D.balances[c],
     *          8
              )
      *     }

            ${c}

        * </div>

        </div>


        *div class="market">

          <di* class="label">

            Preci* actual
            (USDT)

      *   </div>


          <input
     *      data-coin="${c}"
           *type="number"
            step="an*"
            value="${p || ''}"
 *          placeholder="Ingresar"
 *        >


          <div class="*rice">

            ${
           *  p
                ? money(p)
   *            : '—'
            }

 *        </div>

        </div>


 *    </div>


      ${
        p

 *        ? `

            <div clas*="status">


              <b clas*="${
                diff >= 0
   *              ? 'green'
          *       : 'red'
              }">

*               ${
                * diff >= 0
                    ? '*'
                    : ''
       *        }

                ${
    *             fmt(
                *   diff * 100,
                   *1
                  )
            *   }%

              </b>


      *       vs. promedio ·


          *   ${
                need > 0

                  ? `

                    necesita

                    <b>
                      +${
                        fmt(
                          need * 100,
                          1
                        )
                      }%
                    </b>

                    para recuperar
                    el promedio

                  `

                  : `

                    está por encima
                    del break-even

                  `
              }


            </div>

          `

          : ''
      }


      <div class="levels">


        ${
          rows
            .map(r => `

              <div
                class="level ${r.k}"
              >


                <span>

                  ${r.n}

                </span>


                <div class="bar">

                  <i
                    class="dot"
                    style="
                      --pos:${pos(r.v)}
                    "
                  ></i>

                </div>


                <span class="value">

                  ${money(r.v)}

                </span>


              </div>

            `)
            .join('')
        }


      </div>


      <details class="tx">


        <summary>

          Ver movimientos
          del activo

        </summary>


        <div class="tx-grid">


          ${
            D.transactions

              .filter(
                t =>
                  classify(
                    t,
                    c
                  ) !== 'otra'
              )

              .sort(
                (a, b) =>
                  parseDate(b.Fecha) -
                  parseDate(a.Fecha)
              )

              .map(t => `

                <div class="tx-row">


                  <span>

                    <span class="tag">

                      ${
                        classify(
                          t,
                          c
                        ).toUpperCase()
                      }

                    </span>

                    <br>

                    ${t.Fecha}

                  </span>


                  <span>

                    ${
                      t.Precio

                        ? fmt(
                            +t.Precio,
                            4
                          )

                        : '—'
                    }

                  </span>


                </div>

              `)

              .join('')
          }


        </div>


      </details>


    </article>

  `;

}


/* ============================================= */
/* LIMPIAR PRECIOS */
/* ============================================= */

document
  .querySelector('#clear')
  .onclick = () => {

    Object
      .keys(coins)
      .forEach(c => {

        localStorage
          .removeItem(
            'p_' + c
          );

      });


    prices = {};


    render();

  };


/* ============================================= */
/* INICIAR */
/* ============================================= */

load();
