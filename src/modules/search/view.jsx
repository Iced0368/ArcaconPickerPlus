import { useArcaconStore, useElementStore, useMemoStore } from "../../stores";
import { PackageContent } from "../../core/fragment";
import { useDebounce } from "../../hooks";
import { SERACH_PACKAGE_ID } from "../../core/constants/config";

import SearchInputFragment from "./fragment/SearchInputFragment";
import { PickerAheadPortalList } from "../../core/utils";
import { createPortal } from "react-dom";

export default function SearchView({ getInputValue, setInputValue, keyword, getKeyword, setKeyword }) {
  const { pickers } = useElementStore();
  const { memoItems } = useMemoStore();
  const { getArcaconItemsByIds } = useArcaconStore();

  const updateKeyword = useDebounce(setKeyword, 300);

  return (
    <>
      <PickerAheadPortalList
        pickers={pickers}
        getTarget={(picker) => picker.optionsToolbar}
        getKey={(picker) => `arcacon-search-${picker.uid}`}
        getPortalProps={() => ({ className: "arcacon-search-input-container" })}
        render={(picker) => (
          <SearchInputFragment
            value={getInputValue(picker.uid)}
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(picker.uid, value);
              updateKeyword(picker.uid, value);
            }}
          />
        )}
      />
      {
        // 검색어 유무에 따라 콘텐츠 표시 여부 제어
        Object.entries(keyword).map(([uid, kw]) => {
          const picker = pickers.find((p) => p.uid === uid);
          if (!picker?.content) return null;
          picker.content.classList.remove("search-only");
          if (!kw) return null;
          picker.content.classList.add("search-only");

          const searchResult = memoItems.reduce((acc, item) => (item.text.includes(kw) ? [...acc, item] : acc), []);
          const searchResultItems = getArcaconItemsByIds(searchResult.map((item) => item.id));

          return createPortal(
            <div className="--package-wrap" data-package-id={SERACH_PACKAGE_ID} key={`arcacon-search-result-${uid}`}>
              <PackageContent
                id={SERACH_PACKAGE_ID}
                title={`검색 결과: ${kw}, 총 ${searchResult.length}개`}
                items={searchResultItems}
              />
            </div>,
            picker.content,
          );
        })
      }
    </>
  );
}
