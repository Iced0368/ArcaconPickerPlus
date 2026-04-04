import { useEffect } from "react";
import { getThumbnailAttachmentId } from "../../core/utils";

export default function FavoriteController({ pickers, getToggleValue, onClickFavorite }) {
  const handleClick = (uid) => (e) => {
    const target = e.target.closest(".thumbnail-wrap");
    if (target) {
      const id = getThumbnailAttachmentId(target);
      const toggleOn = !!getToggleValue(uid);
      if (toggleOn) {
        e.stopPropagation();
        onClickFavorite(id, true); // 토글이 on인 상태 전달
      }
    }
  };

  useEffect(() => {
    const pickerListeners = pickers.map((picker) => {
      const listener = picker?.self.addEventListener("click", handleClick(picker.uid), true);
      return { picker, listener };
    });

    return () => {
      pickerListeners.forEach(({ picker, listener }) => {
        picker?.self.removeEventListener("click", listener, true);
      });
    };
  }, [pickers.length]);

  return null;
}
