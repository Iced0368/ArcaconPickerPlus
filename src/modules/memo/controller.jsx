import { useEventListener } from "../../hooks";
import { getThumbnailAttachmentId } from "../../core/utils";

export default function MemoController({ openMemo }) {
  // .thumbnail-wrap에서 우클릭
  useEventListener(
    "contextmenu",
    (e) => {
      const isFavoriteSortMode = document.documentElement.dataset.arcaconFavoriteSortMode === "on";
      if (isFavoriteSortMode) {
        return;
      }

      const target = e.target.closest(".thumbnail-wrap");
      if (!target) return;

      e.preventDefault();

      const id = getThumbnailAttachmentId(target);
      openMemo(id);
    },
    document,
    true,
  );

  return null;
}
