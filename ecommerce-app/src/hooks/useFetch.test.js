import { renderHook, act, waitFor } from "@testing-library/react";
import useFetch from "./useFetch";

function createDeferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useFetch", () => {
  test("happy path: loading arranca en true, luego llega data y loading pasa a false", async () => {
    const { promise, resolve } = createDeferred();
    const fetchFn = jest.fn(() => promise);

    const { result } = renderHook(() => useFetch(fetchFn, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await act(async () => {
      resolve({ ok: true });
      await promise;
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBe(null);
  });

  test("error con .kind -> error queda en ese kind", async () => {
    const fetchFn = jest.fn(() => Promise.reject({ kind: "SERVER_ERROR" }));

    const { result } = renderHook(() => useFetch(fetchFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("SERVER_ERROR");
    expect(result.current.data).toBe(null);
  });

  test("error sin .kind -> cae a UNKNOWN", async () => {
    const fetchFn = jest.fn(() => Promise.reject(new Error("boom")));

    const { result } = renderHook(() => useFetch(fetchFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("UNKNOWN");
  });

  test("cambiar deps dispara un nuevo fetch y resetea error a null", async () => {
    let call = 0;
    const fetchFn = jest.fn(() => {
      call += 1;
      return call === 1
        ? Promise.reject({ kind: "SERVER_ERROR" })
        : Promise.resolve({ value: "second" });
    });

    const { result, rerender } = renderHook(({ id }) => useFetch(fetchFn, [id]), {
      initialProps: { id: 1 },
    });

    await waitFor(() => expect(result.current.error).toBe("SERVER_ERROR"));

    rerender({ id: 2 });

    await waitFor(() => expect(result.current.data).toEqual({ value: "second" }));
    expect(result.current.error).toBe(null);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test("desmontar durante un fetch en vuelo no genera warnings ni actualiza estado", async () => {
    const { promise, resolve } = createDeferred();
    const fetchFn = jest.fn(() => promise);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => useFetch(fetchFn, []));

    unmount();

    await act(async () => {
      resolve({ late: true });
      await promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test("usa el fetchFn más reciente al re-disparar, pero solo cuando cambian deps (no por identidad de fetchFn)", async () => {
    const first = jest.fn(() => Promise.resolve("first"));
    const second = jest.fn(() => Promise.resolve("second"));

    const { result, rerender } = renderHook(({ fn, id }) => useFetch(fn, [id]), {
      initialProps: { fn: first, id: 1 },
    });
    await waitFor(() => expect(result.current.data).toBe("first"));

    // mismo deps, nueva identidad de fetchFn: NO debería refetchear
    rerender({ fn: second, id: 1 });
    expect(second).not.toHaveBeenCalled();

    // cambia deps: sí refetchea, usando la versión más reciente de fetchFn
    rerender({ fn: second, id: 2 });
    await waitFor(() => expect(result.current.data).toBe("second"));
  });
});
