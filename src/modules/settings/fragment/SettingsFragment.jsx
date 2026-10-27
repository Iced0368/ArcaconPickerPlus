import { useState } from "react";
import { createModal, Modal } from "../../../core/fragment";
import { useSettingsStore } from "../../../stores";
import BackupSection from "./BackupSection";

const DISPLAY_OPTIONS = [
  { key: "showFavoritePackage", label: "즐겨찾기 탭 표시" },
  { key: "showFrequentPackage", label: "자주 씀 탭 표시" },
];

export default function SettingsFragment({ visible, onClose }) {
  const { settings, setSetting } = useSettingsStore();
  const [busy, setBusy] = useState(false);

  if (!visible) return null;

  const close = () => {
    if (busy) return;
    onClose();
  };

  return createModal(
    <Modal id="settings" onClickBackground={close}>
      <Modal.Title>설정</Modal.Title>
      <Modal.Content>
        <div className="settings-section">
          <div className="settings-section-title">표시</div>
          <div className="settings-options">
            {DISPLAY_OPTIONS.map(({ key, label }) => (
              <label key={key}>
                <input type="checkbox" checked={settings[key]} onChange={(e) => setSetting(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="settings-group-title">백업/복원</div>
        <BackupSection onBusyChange={setBusy} />
      </Modal.Content>
      <Modal.Buttons>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button type="button" className="settings-btn" onClick={close} disabled={busy}>
            닫기
          </button>
        </div>
      </Modal.Buttons>
    </Modal>,
  );
}
