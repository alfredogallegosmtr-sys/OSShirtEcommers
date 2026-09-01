import { useEffect, useRef, useState } from "react";

/**
 * useFetch — el esqueleto de carga/cancelación-al-desmontar duplicado en ~8
 * componentes de este proyecto, extraído a un solo hook.
 *
 * @param {() => Promise<any>} fetchFn función sin argumentos que devuelve una promesa
 *   (normalmente un arrow que cierra sobre una llamada a un servicio tipado,
 *   ej. `() => getProductById(productId)`). Pasar uno nuevo en cada render es
 *   normal y barato — el hook siempre invoca el más reciente (vía ref interno),
 *   pero solo REPITE el fetch cuando cambia `deps`, igual que useEffect.
 * @param {ReadonlyArray<any>} [deps=[]] mismo contrato que el array de deps de useEffect.
 * @returns {{ data: any, loading: boolean, error: string|null, setData: Function }}
 *   - data: valor resuelto de fetchFn(), o null antes de que resuelva.
 *   - loading: true mientras hay un fetch en curso para el deps actual. Arranca
 *     en true siempre (normalización deliberada — ver notas de migración en
 *     el plan de esta feature).
 *   - error: err.kind si existe (así clasifica los rechazos apiClient.js en este
 *     proyecto), si no "UNKNOWN". Se resetea a null al inicio de CADA fetch,
 *     incluyendo refetches.
 *   - setData: escotilla de escape para aplicar una actualización local al dato
 *     ya fetcheado sin volver a disparar el fetch original (ej. tras una
 *     mutación relacionada, como quitar un ítem de la wishlist). Úsese con
 *     moderación.
 */
export default function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFnRef.current();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err?.kind || "UNKNOWN");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // deps es un array opaco provisto por quien llama (todo el contrato del
    // hook) -- exhaustive-deps no puede analizarlo estáticamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}
