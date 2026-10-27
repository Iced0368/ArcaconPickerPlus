import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

const PORTAL_MARKER_ATTRIBUTE = "data-arcacon-picker-plus-portal";

function createPortalContainer(fragment) {
  const container = document.createElement(fragment || "div");
  container.setAttribute(PORTAL_MARKER_ATTRIBUTE, "");
  return container;
}

// PortalAhead로 삽입한 요소를 건너뛴 사이트 원래의 첫 번째 자식
// (삽입된 요소를 기준으로 삼으면 여러 포털이 서로 앞자리를 다투며 무한히 재배치됨)
export function getFirstNativeChild(parent) {
  if (!parent) return null;
  return (
    Array.from(parent.childNodes).find(
      (node) => !(node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(PORTAL_MARKER_ATTRIBUTE)),
    ) || null
  );
}

export default function PortalAhead({ children, fragment, target, className, title, ...restProps }) {
  const containerRef = useRef(null);
  if (!containerRef.current) containerRef.current = createPortalContainer(fragment);

  // 1. target이 바뀔 때만 container를 삽입/제거
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (target && target.parentNode) {
      target.parentNode.insertBefore(container, target);
    }
    /*
    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
    */
  }, [target]);

  // 2. 속성 할당은 별도 effect에서 관리
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (className !== undefined) container.className = className;
    if (title !== undefined) container.title = title;
    Object.entries(restProps).forEach(([key, value]) => {
      if (key.startsWith("data-")) container.setAttribute(key, value);
    });
  }, [className, title, ...Object.values(restProps)]);

  if (!target) return null;
  return createPortal(children, containerRef.current);
}
