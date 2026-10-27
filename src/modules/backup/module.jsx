import { useState } from "react";
import { useElementStore } from "../../stores";
import { PickerPortalList } from "../../core/utils";
import BackupFragment from "./fragment/BackupFragment";

import BackupIcon from "../../assets/backup-icon.svg?react";

import "./view.css";

// title-area에서 "아카콘" 텍스트로 시작하는 span (버튼을 안쪽에 붙이므로 첫 텍스트 노드로 판별)
function getTitleLabel(picker) {
  return (
    Array.from(picker.titleArea?.querySelectorAll("span") || []).find(
      (span) => span.firstChild?.nodeType === Node.TEXT_NODE && span.firstChild.textContent.trim() === "아카콘",
    ) || null
  );
}

/*
  [백업 모듈]
  - 아카콘/즐겨찾기/메모 데이터를 JSON 파일로 내보내기
  - 백업 파일에서 데이터 가져오기 (합치기/덮어쓰기)
*/
export default function BackupModule() {
  const { pickers } = useElementStore();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <PickerPortalList
        pickers={pickers}
        getTarget={getTitleLabel}
        getKey={(picker) => `backup-button-${picker.uid}`}
        render={() => (
          <button
            type="button"
            className="arcacon-backup-button"
            title="백업/복원"
            aria-label="백업/복원"
            onClick={(e) => {
              // title-area에 걸린 사이트 핸들러로 이벤트가 전달되지 않도록
              e.stopPropagation();
              setVisible(true);
            }}
          >
            <BackupIcon />
            <span className="arcacon-backup-button-label">백업/복원</span>
          </button>
        )}
      />
      <BackupFragment visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}
