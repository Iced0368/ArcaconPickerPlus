import "./MemoFragment.css";

import DeleteIcon from "../../../assets/delete-icon.svg?react";
import FavoriteIcon from "../../../assets/favorite-icon.svg?react";
import { createModal, Modal } from "../../../core/fragment";

export default function MemoFragment({
  visible,
  text,
  isFavorite,
  onChange,
  onClose,
  onSave,
  onRemove,
  onToggleFavorite,
}) {
  if (!visible) return null;

  // 엔터(shift+enter 제외)로 저장, esc로 취소
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return createModal(
    <Modal id="memo" onClickBackground={onClose}>
      <Modal.Title>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>메모 작성</span>
          <div className="memo-modal-title-actions">
            <button
              className={`memo-modal-btn-favorite${isFavorite ? " active" : ""}`}
              onClick={onToggleFavorite}
              title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              type="button"
            >
              <FavoriteIcon />
            </button>
            <button className="memo-modal-btn-remove" onClick={onRemove} title="메모 삭제" type="button">
              <DeleteIcon />
            </button>
          </div>
        </div>
      </Modal.Title>
      <Modal.Content>
        <textarea
          className="memo-modal-textarea"
          value={text}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </Modal.Content>
      <Modal.Buttons>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button className="memo-modal-btn-cancel" onClick={onClose}>
            취소
          </button>
          <button className="memo-modal-btn-save" onClick={onSave} type="button">
            저장
          </button>
        </div>
      </Modal.Buttons>
    </Modal>,
  );
}
