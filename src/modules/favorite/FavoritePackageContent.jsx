import { useEffect, useRef, useState } from "react";

export default function FavoritePackageContent({ title, items, onReorder, isSortMode }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragSessionRef = useRef(null);
  const suppressClickRef = useRef(false);
  const isTouchBrowser = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

  const resetDragState = () => {
    dragSessionRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const startPointerDrag = (itemId) => {
    setDraggingId(itemId);
    setDragOverId(null);
  };

  const markSuppressClick = () => {
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const startContextmenuSort = (itemId) => {
    dragSessionRef.current = {
      sourceId: itemId,
      dragOverId: null,
      hasDragged: true,
      pointerId: null,
      trigger: "contextmenu",
    };
    startPointerDrag(itemId);
    markSuppressClick();
  };

  useEffect(() => {
    if (!isSortMode) {
      resetDragState();
    }
  }, [isSortMode]);

  const updateDragTarget = (clientX, clientY, sourceId) => {
    const hoveredItem = document.elementFromPoint(clientX, clientY)?.closest(".favorite-thumbnail-wrap");
    const targetId = hoveredItem?.getAttribute("data-attachment-id") || null;

    if (!targetId || targetId === sourceId) {
      setDragOverId(null);
      return;
    }

    setDragOverId(targetId);
  };

  const finalizePointerDrag = async () => {
    const dragSession = dragSessionRef.current;
    if (!dragSession) return;

    if (dragSession.hasDragged && dragSession.dragOverId && dragSession.dragOverId !== dragSession.sourceId) {
      markSuppressClick();
      await onReorder(dragSession.sourceId, dragSession.dragOverId);
    }

    resetDragState();
  };

  const reorderFromContextmenuSelection = async (targetId) => {
    const sourceId = dragSessionRef.current?.sourceId || draggingId;
    if (!sourceId) return;

    if (sourceId === targetId) {
      resetDragState();
      return;
    }

    setDragOverId(targetId);
    dragSessionRef.current = {
      sourceId,
      dragOverId: targetId,
      hasDragged: true,
      pointerId: null,
      trigger: "contextmenu",
    };

    await finalizePointerDrag();
  };

  return (
    <>
      <span className="package-title">{title}</span>
      <div className={`thumbnails favorite-thumbnails${isSortMode ? " sort-mode" : ""}`}>
        {items.map((item) => {
          if (!item) return null;

          const isDragging = draggingId === item.id;
          const isDragOver = dragOverId === item.id && draggingId !== item.id;

          return (
            <div
              key={`thumbnail-wrap-favorite-${item.id}`}
              className={`thumbnail-wrap loading favorite-thumbnail-wrap${isDragging ? " dragging" : ""}${isDragOver ? " drag-over" : ""}`}
              data-type={item.type || ""}
              data-src={item.imageUrl || ""}
              data-emoticon-id={item.emoticonid || ""}
              data-attachment-id={item.id || ""}
              data-poster={item.poster || ""}
              data-orig={item.orig || ""}
              draggable={false}
              onPointerDown={(event) => {
                if (!isSortMode || !event.isPrimary || isTouchBrowser) return;

                dragSessionRef.current = {
                  pointerId: event.pointerId,
                  sourceId: item.id,
                  dragOverId: null,
                  hasDragged: false,
                  startX: event.clientX,
                  startY: event.clientY,
                };

                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!isSortMode || isTouchBrowser) return;

                const dragSession = dragSessionRef.current;
                if (!dragSession || dragSession.pointerId !== event.pointerId) return;

                const distanceX = event.clientX - dragSession.startX;
                const distanceY = event.clientY - dragSession.startY;
                const hasPassedThreshold = Math.abs(distanceX) > 8 || Math.abs(distanceY) > 8;

                if (!dragSession.hasDragged) {
                  if (!hasPassedThreshold) return;
                  dragSession.hasDragged = true;
                  startPointerDrag(dragSession.sourceId);
                }

                event.preventDefault();
                updateDragTarget(event.clientX, event.clientY, dragSession.sourceId);
                dragSession.dragOverId = document
                  .elementFromPoint(event.clientX, event.clientY)
                  ?.closest(".favorite-thumbnail-wrap")
                  ?.getAttribute("data-attachment-id");
              }}
              onPointerUp={async (event) => {
                if (!isSortMode) return;

                if (isTouchBrowser) {
                  if (draggingId) {
                    await reorderFromContextmenuSelection(item.id);
                  }
                  return;
                }

                const dragSession = dragSessionRef.current;
                if (!dragSession || dragSession.pointerId !== event.pointerId) return;

                event.currentTarget.releasePointerCapture?.(event.pointerId);
                await finalizePointerDrag();
              }}
              onPointerCancel={(event) => {
                if (!isSortMode) return;

                if (isTouchBrowser) {
                  resetDragState();
                  return;
                }

                const dragSession = dragSessionRef.current;
                if (!dragSession || dragSession.pointerId !== event.pointerId) return;

                event.currentTarget.releasePointerCapture?.(event.pointerId);
                resetDragState();
              }}
              onClickCapture={(event) => {
                if (isSortMode || suppressClickRef.current) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              onContextMenu={(event) => {
                if (!isSortMode || !isTouchBrowser) return;

                event.preventDefault();
                event.stopPropagation();
                startContextmenuSort(item.id);
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
            </div>
          );
        })}
      </div>
    </>
  );
}
