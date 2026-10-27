import { useEffect } from "react";
import { useArcaconStore, useElementStore, useUsageStore } from "../../stores";
import { useFetchHook } from "../../hooks";
import { PackageContent, PackageItem } from "../../core/fragment";
import { PickerAheadPortalList, getFirstNativeChild } from "../../core/utils";
import { FREQUENT_PACKAGE_ID } from "../../core/constants/config";

// 자주 씀 패키지에 표시할 최대 아카콘 수
const FREQUENT_DISPLAY_LIMIT = 16;

const FREQUENT_SVG_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#F97316"><path d="M4 20h3V10H4v10zm6.5 0h3V4h-3v16zM17 20h3v-7h-3v7z"/></svg>',
  );

// 댓글 전송 본문에서 사용한 아카콘 id 목록 추출 (단일/콤보)
function getAttachmentIdsFromCommentBody(body) {
  if (typeof body !== "string" || !body.includes("=")) return [];

  const params = new URLSearchParams(body);
  const contentType = params.get("contentType");

  if (contentType === "emoticon") {
    return [params.get("attachmentId")].filter(Boolean);
  }
  if (contentType === "combo_emoticon") {
    try {
      return JSON.parse(params.get("combolist"))
        .map((item) => item?.[1]?.toString())
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

/*
  [자주 씀 모듈]
  - 댓글로 사용한 아카콘을 집계 (최근 사용에 가중치)
  - 자주 쓰는 아카콘 패키지를 표시
*/
export default function FrequentModule() {
  const { pickers } = useElementStore();
  const { usageItems, loadUsageItems, recordUsage } = useUsageStore();
  const { getArcaconItemsByIds, setPermanent } = useArcaconStore();

  useEffect(() => {
    loadUsageItems();
  }, [loadUsageItems]);

  // 동기 콜백(반환값 없음)이라 요청 자체는 Fixer/원본 fetch가 그대로 처리
  useFetchHook(/\/b\/([^/]+)\/\d+\/comment/, (args) => {
    const ids = getAttachmentIdsFromCommentBody(args[1]?.body);
    if (ids.length === 0) return;

    ids.forEach((id) => setPermanent(id));
    void recordUsage(ids);
  });

  const frequentItems = getArcaconItemsByIds(usageItems.map((item) => item.id)).slice(0, FREQUENT_DISPLAY_LIMIT);

  return (
    <>
      <PickerAheadPortalList
        pickers={pickers}
        getTarget={(picker) => getFirstNativeChild(picker.content)}
        getKey={(picker) => `frequent-content-${picker.uid}`}
        getPortalProps={() => ({
          className: "--package-wrap",
          "data-package-id": FREQUENT_PACKAGE_ID,
        })}
        render={() => <PackageContent title="자주 씀" items={frequentItems} />}
      />
      <PickerAheadPortalList
        pickers={pickers}
        getTarget={(picker) => getFirstNativeChild(picker.sidebar)}
        getKey={(picker) => `frequent-item-${picker.uid}`}
        getPortalProps={() => ({
          className: "package-item",
          "data-package-id": FREQUENT_PACKAGE_ID,
          "data-package-name": "자주 씀",
          title: "자주 씀",
        })}
        render={() => <PackageItem id={FREQUENT_PACKAGE_ID} title="자주 씀" imgUrl={FREQUENT_SVG_DATA_URL} />}
      />
    </>
  );
}
