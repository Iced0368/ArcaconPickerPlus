import { useEffect } from "react";
import { useElementStore, useFavoriteStore } from "../../stores";
import FavoriteView from "./view";

/*
  [즐겨찾기 모듈]
  - 즐겨찾기를 추가하고 즐겨찾기 패키지를 표시하는 모듈
  - 즐겨찾기 된 아카콘 오버레이 표시
*/
export default function FavoriteModule() {
  const { loadFavoriteItems } = useFavoriteStore();
  const { pickers } = useElementStore();

  useEffect(() => {
    loadFavoriteItems();
  }, [loadFavoriteItems]);

  return <FavoriteView pickers={pickers} />;
}
