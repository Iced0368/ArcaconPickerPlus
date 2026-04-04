import { getEmoticonId } from "../../core/utils";
import { useFetchHook } from "../../hooks";
import { originalFetch } from "../../hooks/useFetchHook";
import { useArcaconStore } from "../../stores";
import FixerView from "./view";

/*
  [Fixer 모듈]
  - 아카콘 사용시 유효하지 않은 emoticon id를 자동으로 수정
*/
export default function FixerModule() {
  const { getArcaconById, setArcaconItem } = useArcaconStore();

  useFetchHook(/\/b\/([^/]+)\/\d+\/comment/, async (args) => {
    const body = args[1]?.body;

    let parsed = {};
    if (typeof body === "string" && body.includes("=")) {
      parsed = Object.fromEntries(new URLSearchParams(body));
    }

    // 아카콘 단일
    if (parsed.contentType === "emoticon") {
      const id = parsed.attachmentId;
      const emoticonid = parsed.emoticonId;

      if (emoticonid <= 0) {
        // 유효하지 않은 emoticonid인 경우 arcacon 테이블 수정
        const arcaconItem = getArcaconById(id, true);
        if (arcaconItem) {
          arcaconItem.emoticonid = await getEmoticonId(id);
          setArcaconItem(arcaconItem, true);

          // 요청 파라미터 수정
          parsed.emoticonId = arcaconItem.emoticonid;
        }
      }
    }
    // 콤보콘
    else if (parsed.contentType === "combo_emoticon") {
      const combolist = JSON.parse(parsed.combolist).map((item) => ({ id: item[1], emoticonid: item[0] }));

      for (const { id, emoticonid } of combolist) {
        if (emoticonid <= 0) {
          // 유효하지 않은 emoticonid인 경우 arcacon 테이블 수정
          const arcaconItem = getArcaconById(id, true);
          if (arcaconItem) {
            arcaconItem.emoticonid = await getEmoticonId(id);
            setArcaconItem(arcaconItem, true);
            // 요청 파라미터 수정
            combolist.emoticonid = arcaconItem.emoticonid;
          }
        }
      }
      parsed.combolist = JSON.stringify(combolist.map((item) => [item.emoticonid, item.id]));
    }

    // 수정된 파라미터로 재조합
    let modifiedBody = "";
    for (const [key, value] of Object.entries(parsed)) {
      if (modifiedBody.length > 0) modifiedBody += "&";
      modifiedBody += `${key}=${encodeURIComponent(value)}`;
    }

    const newArgs = [...args];
    if (newArgs[1]) {
      newArgs[1] = { ...newArgs[1], body: modifiedBody };
    } else {
      newArgs[1] = { body: modifiedBody };
    }
    return originalFetch.apply(this, newArgs);
  });

  return <FixerView />;
}
