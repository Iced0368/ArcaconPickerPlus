import { useState } from "react";
import { useElementStore } from "../../stores";
import { PickerAheadPortalList } from "../../core/utils";
import SettingsFragment from "./fragment/SettingsFragment";

import SettingsIcon from "../../assets/settings-icon.svg?react";

import "./view.css";

/*
  [설정 모듈]
  - 옵션 툴바의 설정 버튼으로 설정 창 열기
  - 즐겨찾기/자주 씀 탭 표시 여부
  - 데이터 백업/복원 (내보내기, 가져오기: 합치기/덮어쓰기)
*/
export default function SettingsModule() {
  const { pickers } = useElementStore();
  const [visible, setVisible] = useState(false);

  return (
    <>
      {
        // 옵션 툴바의 콤보콘 토글과 닫기 버튼 사이 (사이트 원래 요소인 닫기 버튼 앞에 삽입)
        <PickerAheadPortalList
          pickers={pickers}
          getTarget={(picker) => picker.optionsToolbar?.querySelector('[data-action="close"]')}
          getKey={(picker) => `settings-button-${picker.uid}`}
          getPortalProps={() => ({ fragment: "span", className: "arcacon-settings-button-wrap" })}
          render={() => (
            <button
              type="button"
              className="arcacon-settings-button"
              title="설정"
              aria-label="설정"
              onClick={(e) => {
                // 툴바에 걸린 사이트 클릭 핸들러로 전달되지 않도록
                e.stopPropagation();
                setVisible(true);
              }}
            >
              <SettingsIcon />
            </button>
          )}
        />
      }
      <SettingsFragment visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}
