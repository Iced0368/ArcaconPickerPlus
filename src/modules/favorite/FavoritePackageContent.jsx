import { useEffect, useRef, useState } from "react";

export default function FavoritePackageContent({ title, items, onReorder, isSortMode }) {
  const [selectedId, setSelectedId] = useState(null);
  const suppressClickRef = useRef(false);

  const resetDragState = () => {
    setSelectedId(null);
  };

  const markSuppressClick = () => {
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  useEffect(() => {
    if (!isSortMode) {
      resetDragState();
    }
  }, [isSortMode]);

  useEffect(() => {
    if (!isSortMode || !selectedId) return;

    const handleDocumentClick = (event) => {
      if (event.target.closest(".favorite-thumbnail-wrap")) return;
      resetDragState();
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isSortMode, selectedId]);

  const handleSelectOrReorder = async (itemId) => {
    if (!isSortMode) return;

    if (!selectedId) {
      setSelectedId(itemId);
      markSuppressClick();
      return;
    }

    if (selectedId === itemId) {
      resetDragState();
      markSuppressClick();
      return;
    }

    markSuppressClick();
    await onReorder(selectedId, itemId);
    resetDragState();
  };

  return (
    <>
      <span className="package-title">{title}</span>
      {isSortMode && (
        <div className="favorite-sort-guide" role="status" aria-live="polite">
          {selectedId
            ? "선택됨. 이동할 위치의 아카콘을 눌러 순서를 바꾸세요."
            : "순서를 바꿀 아카콘을 눌러 선택하세요."}
        </div>
      )}
      <div className={`thumbnails favorite-thumbnails${isSortMode ? " sort-mode" : ""}`}>
        {items.map((item) => {
          if (!item) return null;

          const isDragging = selectedId === item.id;

          return (
            <div
              key={`thumbnail-wrap-favorite-${item.id}`}
              className={`thumbnail-wrap loading favorite-thumbnail-wrap${isDragging ? " dragging" : ""}`}
              data-type={item.type || ""}
              data-src={item.imageUrl || ""}
              data-emoticon-id={item.emoticonid || ""}
              data-attachment-id={item.id || ""}
              data-poster={item.poster || ""}
              data-orig={item.orig || ""}
              draggable={false}
              onClickCapture={(event) => {
                if (isSortMode) {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleSelectOrReorder(item.id);
                  return;
                }

                if (suppressClickRef.current) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              onContextMenu={(event) => {
                if (!isSortMode) return;

                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {item.type === "video" ? (
                <video
                  className="thumbnail"
                  draggable="false"
                  data-attachmentid={item.id || ""}
                  data-emoticonid={item.emoticonid || ""}
                  src={`${item.imageUrl || ""}`}
                  poster={`${item.poster || ""}`}
                  data-orig={`${item.orig || ""}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                ></video>
              ) : (
                <img
                  className="thumbnail"
                  draggable="false"
                  src={item.imageUrl || ""}
                  data-emoticonid={item.emoticonid || ""}
                  data-attachmentid={item.id || ""}
                />
              )}
              {isDragging && <div className="favorite-sort-badge">선택됨</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
