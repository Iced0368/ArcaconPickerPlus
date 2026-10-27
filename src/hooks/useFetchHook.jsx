import { useEffect, useRef } from "react";

// 전역 콜백 레지스트리
const fetchHookRegistry = [];
let isFetchPatched = false;
export let originalFetch = null;

function patchFetch() {
  if (isFetchPatched) return;
  const globalObj = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  originalFetch = globalObj.fetch;
  globalObj.fetch = async function (...args) {
    // string, Request, URL 객체 모두 문자열로 정규화
    const url = String(args[0]?.url ?? args[0] ?? "");
    let result;
    for (const { pattern, callback } of fetchHookRegistry) {
      if (typeof pattern === "string" && url === pattern) {
        try {
          const cbResult = callback(...args);
          if (cbResult !== undefined) {
            result = cbResult;
          }
        } catch (e) {}
      } else if (pattern instanceof RegExp) {
        const match = url.match(pattern);
        if (match) {
          try {
            // 매치된 그룹(캡처)만 콜백에 인자로 전달
            const cbResult = callback(args, ...match.slice(1), ...args);
            if (cbResult !== undefined) {
              result = cbResult;
            }
          } catch (e) {}
        }
      }
    }
    if (result !== undefined) {
      return result;
    }
    return originalFetch.apply(this, args);
  };
  isFetchPatched = true;
}

// callback 형식: (fetchArgs, callbackArgs) => fetchResponse | undefined
export default function useFetchHook(pattern, callback) {
  const ref = useRef({ pattern, callback });
  ref.current.pattern = pattern;
  ref.current.callback = callback;

  useEffect(() => {
    patchFetch();
    const entry = { pattern, callback };
    fetchHookRegistry.push(entry);
    return () => {
      const idx = fetchHookRegistry.indexOf(entry);
      if (idx !== -1) fetchHookRegistry.splice(idx, 1);
    };
  }, [pattern, callback]);
}
