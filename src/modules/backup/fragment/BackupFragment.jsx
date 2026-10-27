import { useState } from "react";
import { createModal, Modal } from "../../../core/fragment";
import {
  STORAGE_ARCACON_DATA,
  STORAGE_FAVORITE_DATA,
  STORAGE_MEMO_DATA,
  STORAGE_USAGE_DATA,
} from "../../../core/constants/config";
import { exportAllData, importAllData } from "../../../stores/persistent";

const TABLE_LABELS = {
  [STORAGE_ARCACON_DATA]: "아카콘",
  [STORAGE_FAVORITE_DATA]: "즐겨찾기",
  [STORAGE_MEMO_DATA]: "메모",
  [STORAGE_USAGE_DATA]: "사용 기록",
};

function formatCounts(stores) {
  return Object.entries(TABLE_LABELS)
    .map(([tableName, label]) => `${label} ${stores[tableName]?.length ?? stores[tableName] ?? 0}개`)
    .join(", ");
}

async function downloadBackup(prefix = "backup") {
  const dump = await exportAllData();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(dump)], { type: "application/json" }));
  a.download = `ArcaconPickerPlus-${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return dump;
}

export default function BackupFragment({ visible, onClose }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("merge");
  const [status, setStatus] = useState(null); // { type: "info" | "error" | "done", message }
  const [busy, setBusy] = useState(false);

  if (!visible) return null;

  const close = () => {
    if (busy) return;
    setFile(null);
    setMode("merge");
    setStatus(null);
    onClose();
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const dump = await downloadBackup();
      setStatus({ type: "info", message: `내보내기 완료: ${formatCounts(dump.stores)}` });
    } catch (error) {
      console.error("[ArcaconPickerPlus] Failed to export backup: ", error);
      setStatus({ type: "error", message: `내보내기 실패: ${error.message}` });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const dump = JSON.parse(await file.text());

      // 덮어쓰기 전에 현재 데이터를 자동으로 백업
      if (mode === "overwrite") {
        await downloadBackup("before-overwrite");
      }

      const added = await importAllData(dump, mode);
      setStatus({
        type: "done",
        message: `${mode === "overwrite" ? "덮어쓰기" : "합치기"} 완료: ${formatCounts(added)}`,
      });
    } catch (error) {
      console.error("[ArcaconPickerPlus] Failed to import backup: ", error);
      setStatus({
        type: "error",
        message: `가져오기 실패: ${error instanceof SyntaxError ? "JSON 파일을 읽을 수 없습니다." : error.message}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return createModal(
    <Modal id="backup" onClickBackground={close}>
      <Modal.Title>백업/복원</Modal.Title>
      <Modal.Content>
        <div className="backup-section">
          <div className="backup-section-title">내보내기</div>
          <p className="backup-description">아카콘, 즐겨찾기, 메모, 사용 기록을 JSON 파일로 저장합니다.</p>
          <button type="button" className="backup-btn" onClick={handleExport} disabled={busy}>
            백업 파일 다운로드
          </button>
        </div>

        <div className="backup-section">
          <div className="backup-section-title">가져오기</div>
          <input
            type="file"
            accept=".json,application/json"
            className="backup-file-input"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setStatus(null);
            }}
            disabled={busy}
          />
          <div className="backup-mode">
            <label>
              <input type="radio" name="backup-mode" checked={mode === "merge"} onChange={() => setMode("merge")} />
              합치기 (없는 항목만 추가)
            </label>
            <label>
              <input
                type="radio"
                name="backup-mode"
                checked={mode === "overwrite"}
                onChange={() => setMode("overwrite")}
              />
              덮어쓰기 (기존 데이터 삭제)
            </label>
          </div>
          {mode === "overwrite" && (
            <p className="backup-warning">
              현재 데이터가 모두 지워집니다. 실행 전에 현재 데이터가 자동으로 백업됩니다.
            </p>
          )}
          <button type="button" className="backup-btn" onClick={handleImport} disabled={busy || !file}>
            가져오기
          </button>
        </div>

        {status && <p className={`backup-status ${status.type}`}>{status.message}</p>}
      </Modal.Content>
      <Modal.Buttons>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          {status?.type === "done" ? (
            <button type="button" className="backup-btn primary" onClick={() => location.reload()}>
              새로고침하여 적용
            </button>
          ) : (
            <button type="button" className="backup-btn" onClick={close} disabled={busy}>
              닫기
            </button>
          )}
        </div>
      </Modal.Buttons>
    </Modal>,
  );
}
