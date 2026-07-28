# Condensación intersticial — Método Glaser

Calculadora interactiva de condensación intersticial en muros multicapa (método Glaser, ISO 13788).  
Creado para el Gremio de Bioconstrucción Chile :)  

https://pupipupi.github.io/glaser-condensacion/

## Qué hace esta calculadora

Esta app calcula si un muro puede acumular humedad **dentro** de sus capas —no en la
superficie, sino escondida entre los materiales— durante los meses fríos. A este fenómeno se
lo conoce como **condensación intersticial**, y es un problema silencioso: no se ve hasta que
ya causó daño (pérdida de resistencia del material, moho, pudrición de fibras vegetales como
paja).

Usa el **método Glaser**, el procedimiento de cálculo estándar (ISO 13788) para estimar este
riesgo antes de construir.

### Cómo funciona, en simple

Un muro se arma por capas (por ejemplo: barro por dentro, una pintura o revestimiento por
fuera). Cada capa tiene dos propiedades clave:

- **Qué tan bien deja pasar el calor** (conductividad térmica, λ) — define cómo baja la
  temperatura a medida que avanzás del interior al exterior del muro.
- **Qué tan bien deja pasar el vapor de agua** (factor de resistencia a la difusión, μ) — un
  material como el barro deja pasar el vapor con facilidad; una pintura oleosa o una membrana
  plástica casi no lo dejan pasar.

La calculadora traza dos curvas a lo largo del espesor del muro:

1. **Cuánto vapor "quiere" pasar** en cada punto, según la humedad interior y exterior.
2. **Cuánto vapor puede sostener el aire** en ese punto sin condensar, según la temperatura
   ahí (el aire frío sostiene mucho menos vapor que el aire caliente).

Si en algún punto la primera curva supera a la segunda, ese punto no puede sostener todo el
vapor que le está llegando — y condensa ahí, dentro del muro.

### Cómo usarla

1. Ajustá temperatura y humedad interior/exterior con los sliders.
2. Agregá o editá las capas del muro, en orden real: de adentro hacia afuera.
3. Mirá el resultado abajo: si dice que condensa, te muestra en qué capa exacta ocurre —
   marcada con una gota en el corte del muro.

### Qué NO hace

Es un cálculo simplificado en condiciones fijas del lugar (un solo momento, no todo el
año), y no considera que materiales como el barro absorben y liberan humedad de forma dinámica
día a día y tampoco considera su orientación ni exposición solar.
Sirve como primera evaluación de riesgo, no como verificación definitiva para un
proyecto que ya se está construyendo.
