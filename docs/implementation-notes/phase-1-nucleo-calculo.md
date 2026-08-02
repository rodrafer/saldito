# Fase 1 — Núcleo de cálculo

**PR:** [#2](https://github.com/rodrafer/saldito/pull/2) · 63 tests · sin UI

Los algoritmos de la sección 2 de la especificación funcional, en
`features/deudas/calculo/`. TypeScript puro: no importa nada de Next ni de Supabase, así
que corre idéntico en los tests, en el servidor al renderizar y en el cliente para los
updates optimistas.

---

## ⚠️ El pseudocódigo de la especificación 2.3 rompe su propio invariante

**Esto hay que avisárselo a quien escribió la especificación.**

El algoritmo de `deudasDeGasto` tal como está en el documento viola la igualdad que el mismo
documento señala como _"la mejor red de seguridad del sistema"_: que el saldo neto de cada
persona coincida con `puso − consumió`.

### El caso que lo rompe

Lo encontró el property testing. No se nos habría ocurrido escribirlo a mano:

> Un gasto de **2**. Caro y Dani ponen **1 cada uno** y lo consumen entre los dos por partes
> iguales, **1 cada uno**. Nadie debería quedar debiendo nada.

El pseudocódigo procesa una fila por vez:

| Fila        | Reparto entre pagadores | Sobrante                            | Se descarta la porción propia | Resultado             |
| ----------- | ----------------------- | ----------------------------------- | ----------------------------- | --------------------- |
| Caro debe 1 | empate 0,5 / 0,5        | va al primero de la lista: **Caro** | sí, era de Caro               | Caro no debe nada     |
| Dani debe 1 | empate 0,5 / 0,5        | va al primero de la lista: **Caro** | no, era de Caro               | Dani le debe 1 a Caro |

Resultado: Dani queda debiendo 1 y Caro cobrando 1, cuando `puso − consumió` da cero para
los dos.

### La causa

Redondear fila por fila garantiza que cada **fila** cierre exacto contra el reparto, pero
deja las **columnas** a la deriva respecto de lo que puso cada uno. Y el saldo neto de una
persona es exactamente `su columna − su fila`.

Con un solo pagador el problema no existe, porque la única columna se lleva todo. Por eso el
prototipo nunca lo mostró: aparece recién ahora, que la especificación agregó multi-pagador.

### Cómo se resolvió

`repartirMatriz`, en `features/deudas/calculo/redondeo.ts`, redondea la matriz completa
preservando **los dos márgenes**:

1. Piso de cada celda, y el sobrante de cada fila por mayor parte fraccionaria. Las filas
   quedan exactas.
2. Corrección de columnas: mientras una columna esté por encima de su total y otra por
   debajo, se mueve una unidad entre ellas **dentro de una misma fila**, que es lo único que
   no rompe lo ya ajustado en el paso 1.

El paso 2 siempre puede avanzar: una columna que está por encima de su total tiene suma
mayor a cero, así que alguna de sus celdas vale al menos uno.

Con las columnas exactas, descartar la porción propia deja el invariante intacto. El
resultado sigue siendo la atribución proporcional que pide la sección 1.4, y la pantalla
Deudas no cambia.

---

## Ids que se leen a través de la cadena de prototipos

Segundo bug encontrado por property testing. Con un id llamado `valueOf`, `toString` o
`__proto__`, el patrón `out[id] ?? 0` sobre un objeto plano devuelve la función heredada de
`Object.prototype` en vez de cero, y el acumulador queda mal.

Los acumuladores pasaron a ser `Map`, con conversión a objeto recién al final vía
`Object.fromEntries` —que define propiedades propias, sin pasar por el setter de
`__proto__`— y las lecturas de registros provistos por el usuario van por `montoDe`, que
verifica `Object.hasOwn` y que el valor sea numérico.

Hoy los ids van a ser UUIDs de Supabase, así que en la práctica no se dispara. Igual no es
una clase de bug que convenga dejar viva en el módulo que reparte plata.

---

## Desvíos deliberados del pseudocódigo

### `calcularDeudas` recibe los integrantes como parámetro

El pseudocódigo hace `grupo.integrantes.map(...)`, pero el tipo `Grupo` del handoff no tiene
ese campo: `Integrante` es una entidad propia con su `grupoId`, igual que van a estar las
tablas. Pasarlos aparte mantiene las funciones puras sin obligar a armar un objeto compuesto
sólo para llamarlas.

### Los gastos que originan cada deuda se acumulan por moneda

El pseudocódigo acumula `origen[deudor][acreedor]` sin distinguir moneda. Como un mismo par
puede deberse plata en ARS y en USD por gastos distintos, cada deuda terminaría mostrando en
su detalle los gastos de la otra moneda.

### `derivarMovimientos` recibe el generador de ids

El pseudocódigo llama a un `uid()` global. Inyectarlo (con `crypto.randomUUID` por defecto)
mantiene la función determinista y deja que los tests comparen el resultado completo, no
sólo su forma.

---

## Sobre los tests

Las particiones de los fixtures se generan con un **algoritmo de cortes independiente** del
de producción. Si se armaran con `repartirProporcional`, los tests estarían validando el
código contra sí mismo y los dos bugs de arriba habrían pasado desapercibidos.

Los invariantes cubiertos, todos con property testing:

- las contribuciones y el reparto suman **exactamente** el monto;
- por moneda, la suma de todos los saldos del grupo es **cero**;
- el saldo de cada persona coincide con `puso − consumió` **y** con la suma de sus deudas
  por par;
- el plan salda exacto, con a lo sumo `n − 1` movimientos por moneda.

El segundo invariante de la lista es el que atrapó el bug de la sección 2.3: contrasta el
camino largo —deuda por par, con su redondeo proporcional— contra el cálculo directo desde
los gastos.

---

## Decisiones menores

**`deudasDeGasto` devuelve la matriz bruta, sin netear.** El neteo por par es tarea de
`calcularDeudas`, tal como separa la especificación entre 2.3 y 2.4. Un gasto donde cada uno
puso lo que consumió devuelve dos deudas enfrentadas que recién se cancelan al netear.

**Se cuentan los integrantes inactivos.** Nadie se va del grupo debiendo (sección 6.7): si
sus deudas desaparecieran del cálculo, la regla que bloquea la salida no tendría con qué
frenarlo.

**Los pagos declarados sin confirmar reducen la deuda igual.** Lo pide la sección 2.7: la
confirmación del acreedor es un aviso, no una condición.

**En modo porcentaje el reparto es proporcional a los porcentajes**, no calculado contra 100. Si por un dato viejo los porcentajes no sumaran exactamente 100, el reparto igual
cierra contra el monto y el saldo del grupo no se rompe.
