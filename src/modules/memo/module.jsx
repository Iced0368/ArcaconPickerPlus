import { useState, useCallback, useEffect } from "react";
import { useArcaconStore, useFavoriteStore, useMemoStore } from "../../stores";

import MemoController from "./controller";
import MemoView from "./view";
/*
  [메모 모듈]
  - 메모 기능을 추가
  - 메모된 아카콘 오버레이 표시
*/

export default function MemoModule() {
  const { loadMemoItems, getMemoById, setMemoItem, deleteMemoItem } = useMemoStore();
  const { addFavoriteItem, removeFavoriteItem } = useFavoriteStore();
  const { setPermanent } = useArcaconStore();

  const [currentMemoId, setCurrentMemoId] = useState(null);
  const [memoVisible, setMemoVisible] = useState(false);

  useEffect(() => {
    loadMemoItems();
  }, [loadMemoItems]);

  // 메모 열기 (id 지정)
  const openMemo = useCallback((id) => {
    setCurrentMemoId(id);
    setMemoVisible(true);
  }, []);

  // 메모 닫기
  const closeMemo = useCallback(() => {
    setCurrentMemoId(null);
    setMemoVisible(false);
  }, []);

  // 메모 저장
  const saveMemo = useCallback((id, text) => {
    if (!text) {
      deleteMemoItem(id);
      return;
    }
    setMemoItem(id, text);
    setPermanent(id);
  }, []);

  const toggleFavorite = useCallback((id, isFavorite) => {
    if (!id) return;

    if (isFavorite) {
      removeFavoriteItem(id);
      return;
    }

    addFavoriteItem(id);
    setPermanent(id);
  }, []);

  return (
    <>
      <MemoView
        memoVisible={memoVisible}
        currentMemoId={currentMemoId}
        openMemo={openMemo}
        closeMemo={closeMemo}
        saveMemo={saveMemo}
        removeMemo={deleteMemoItem}
        toggleFavorite={toggleFavorite}
      />
      <MemoController openMemo={openMemo} />
    </>
  );
}
