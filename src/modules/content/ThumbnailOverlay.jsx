import { createPortal } from "react-dom";
import { useElementStore } from "../../stores";
import { getThumbnailAttachmentId } from "../../core/utils";

import "./overlay.css";

// .arcaconPicker 요소를 감지해 store에 저장하는 컴포넌트
export default function ThumbnailOverlay() {
  const { thumbnailWraps } = useElementStore();

  return (
    <>
      {thumbnailWraps.map((node) => {
        if (!node) return;
        // 부모에 position: relative 적용 (이미 있으면 무시)
        if (node.style.position === "" || node.style.position === "static") {
          node.style.position = "relative";
        }
        return createPortal(<div className="arcacon-overlay-list"></div>, node);
      })}
    </>
  );
}

export function getOverlay(node) {
  if (!node) return null;
  return node.querySelector(".arcacon-overlay-list");
}

export function ThumbnailOverlayPortal({ shouldRender, children }) {
  const { thumbnailWraps } = useElementStore();

  return (
    <>
      {thumbnailWraps.map((node) => {
        if (!node) return null;

        const id = getThumbnailAttachmentId(node);
        if (!shouldRender(node, id)) return null;

        const overlay = getOverlay(node);
        if (!overlay) return null;

        return createPortal(children(node, id), overlay);
      })}
    </>
  );
}
