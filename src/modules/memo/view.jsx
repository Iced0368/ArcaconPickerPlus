import { useState, useEffect } from "react";
import MemoFragment from "./fragment/MemoFragment";
import { getThumbnailAttachmentId } from "../../core/utils";
import { ThumbnailOverlayPortal } from "../content";

import MemoIcon from "../../assets/memo-icon.svg?react";
import useFavoriteStore from "../../stores/favorite";
import useMemoStore from "../../stores/memo";

import "./arcacon-memo-overlay.css";

export default function MemoView({
  memoVisible,
  currentMemoId,
  openMemo,
  closeMemo,
  saveMemo,
  removeMemo,
  toggleFavorite,
}) {
  const { getMemoById } = useMemoStore();
  const { favorites, isFavorite } = useFavoriteStore();
  const [memoText, setMemoText] = useState("");

  useEffect(() => {
    if (memoVisible && currentMemoId) {
      const memo = getMemoById(currentMemoId);
      setMemoText(memo?.text || "");
    }
  }, [memoVisible, currentMemoId]);

  const isMemoed = (id) => {
    return getMemoById(id) !== null;
  };

  const currentFavorite = currentMemoId ? isFavorite(currentMemoId) : false;

  return (
    <>
      <MemoFragment
        visible={memoVisible}
        text={memoText}
        isFavorite={currentFavorite}
        onChange={(e) => setMemoText(e.target.value)}
        onClose={() => {
          setMemoText("");
          closeMemo();
        }}
        onSave={() => {
          saveMemo(currentMemoId, memoText);
          setMemoText("");
          closeMemo();
        }}
        onRemove={() => {
          removeMemo(currentMemoId);
          setMemoText("");
          closeMemo();
        }}
        onToggleFavorite={() => toggleFavorite(currentMemoId, currentFavorite)}
      />
      <ThumbnailOverlayPortal shouldRender={(_node, id) => isMemoed(id)}>
        {(node, id) => (
          <div className="arcacon-overlay memo" data-attachment-id={getThumbnailAttachmentId(node) || id}>
            <MemoIcon />
          </div>
        )}
      </ThumbnailOverlayPortal>
    </>
  );
}
