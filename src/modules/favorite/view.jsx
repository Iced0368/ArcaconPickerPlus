import { useEffect, useState } from "react";
import { PackageItem } from "../../core/fragment";
import { FAVORITE_PACKAGE_ID } from "../../core/constants/config";
import { useArcaconStore } from "../../stores";
import { getThumbnailAttachmentId } from "../../core/utils";
import { ThumbnailOverlayPortal } from "../content/ThumbnailOverlay";

import FavoriteIcon from "../../assets/favorite-icon.svg?react";
import FavoritePackageContent from "./FavoritePackageContent";

import "./arcacon-favorite-icon.css";
import useFavoriteStore from "../../stores/favorite";
import { PickerAheadPortalList } from "../../core/utils";

const STAR_SVG_DATA_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD600"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>',
  );

export default function FavoriteView({ pickers }) {
  const { favorites, isFavorite, reorderFavoriteItems } = useFavoriteStore();
  const { getArcaconItemsByIds } = useArcaconStore();
  const [isSortMode, setIsSortMode] = useState(false);

  const favoriteItems = getArcaconItemsByIds(favorites.map((fav) => fav.id));

  useEffect(() => {
    document.documentElement.dataset.arcaconFavoriteSortMode = isSortMode ? "on" : "off";

    return () => {
      delete document.documentElement.dataset.arcaconFavoriteSortMode;
    };
  }, [isSortMode]);

  return (
    <>
      {
        // 아카콘 패키지 선택 버튼
        <PickerAheadPortalList
          pickers={pickers}
          getTarget={(picker) => picker.optionsToolbar?.firstChild}
          getKey={(picker) => `sort-toggle-${picker.uid}`}
          getPortalProps={() => ({
            fragment: "label",
            className: "option-combo-emoticon visible",
            id: "favorite-sort-toggle-button",
          })}
          render={() => (
            <>
              정렬 토글
              <input
                type="checkbox"
                name="option-favorite-sort"
                checked={isSortMode}
                onChange={() => setIsSortMode((current) => !current)}
              />
            </>
          )}
        />
      }
      {
        // 아카콘 패키지 선택 버튼
        <PickerAheadPortalList
          pickers={pickers}
          getTarget={(picker) => picker.content?.firstChild}
          getKey={(picker) => `content-${picker.uid}`}
          getPortalProps={() => ({
            className: "--package-wrap",
            "data-package-id": FAVORITE_PACKAGE_ID,
          })}
          render={() => (
            <FavoritePackageContent
              items={favoriteItems}
              title="즐겨찾기"
              onReorder={reorderFavoriteItems}
              isSortMode={isSortMode}
            />
          )}
        />
      }
      {
        // 아카콘 패키지 아이템 표시
        <PickerAheadPortalList
          pickers={pickers}
          getTarget={(picker) => picker.sidebar?.firstChild}
          getKey={(picker) => `item-${picker.uid}`}
          getPortalProps={() => ({
            className: "package-item",
            "data-package-id": FAVORITE_PACKAGE_ID,
            "data-package-name": "즐겨찾기",
            title: "즐겨찾기",
          })}
          render={() => <PackageItem id={FAVORITE_PACKAGE_ID} title="즐겨찾기" imgUrl={STAR_SVG_DATA_URL} />}
        />
      }
      <ThumbnailOverlayPortal shouldRender={(_node, id) => isFavorite(id)}>
        {(_node, id) => (
          <div className="arcacon-overlay favorite" data-attachment-id={getThumbnailAttachmentId(_node) || id}>
            <FavoriteIcon />
          </div>
        )}
      </ThumbnailOverlayPortal>
    </>
  );
}
