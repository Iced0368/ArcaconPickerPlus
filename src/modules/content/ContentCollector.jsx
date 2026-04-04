import { useEffect } from "react";
import { useElementStore, useArcaconStore } from "../../stores";
import { useEventListener, useFetchHook } from "../../hooks";
import { originalFetch } from "../../hooks/useFetchHook";
import { getThumbnailArcaconItem } from "../../core/utils";

// .arcaconPicker 요소를 감지해 store에 저장하는 컴포넌트
export default function ContentCollector() {
  const { setArcaconPicker, setThumbnailWraps } = useElementStore();
  const { loadArcaconItems, setArcaconItem, refreshArcaconItemsByEmoticonData } = useArcaconStore();

  const getChildElements = (picker) => {
    // 고유 id 부여
    if (!picker.hasAttribute("data-uid")) {
      picker.setAttribute("data-uid", crypto.randomUUID());
    }
    const uid = picker.getAttribute("data-uid");

    const titleArea = picker.querySelector(".title-area");
    const mainArea = picker.querySelector(".main-area");
    const optionsToolbar = titleArea ? titleArea.querySelector(".options-toolbar") : null;
    const sidebar = mainArea ? mainArea.querySelector(".sidebar") : null;
    const content = mainArea ? mainArea.querySelector(".content") : null;
    return { self: picker, titleArea, mainArea, optionsToolbar, sidebar, content, uid };
  };

  // 렌더링 된 아카콘 데이터 저장
  const saveArcaconItem = (thumb) => {
    const arcaconItem = getThumbnailArcaconItem(thumb);
    if (!arcaconItem?.id) return;
    setArcaconItem(arcaconItem, false);
  };

  useEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (target.classList.contains("thumbnail-wrap")) {
        console.log(target);
        saveArcaconItem(target);
      }
    },
    document,
  );

  useFetchHook(/\/api\/emoticon2\/(\d+)(?:\?|$)/, async (args, emoticonid) => {
    const response = await originalFetch.apply(this, args);

    try {
      const responseData = await response.clone().json();
      await refreshArcaconItemsByEmoticonData(emoticonid, responseData);
    } catch (error) {
      console.error(
        "[ArcaconPickerPlus] Failed to refresh arcacon items from emoticon API response: ",
        emoticonid,
        error,
      );
    }

    return response;
  });

  useEffect(() => {
    loadArcaconItems();

    // MutationObserver로 동적 생성 감지
    const observer = new MutationObserver(() => {
      const pickers = document.querySelectorAll(".arcaconPicker");
      const newPickers = Array.from(pickers).map((picker) => getChildElements(picker));
      setArcaconPicker(newPickers);

      const thumbnails = document.querySelectorAll("img.thumbnail, video.thumbnail");
      const thumbnailWraps = Array.from(thumbnails).map((thumb) => thumb.closest(".thumbnail-wrap"));
      thumbnailWraps.forEach((wrap) => saveArcaconItem(wrap));
      setThumbnailWraps(thumbnailWraps);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null; // 렌더링 없음
}
