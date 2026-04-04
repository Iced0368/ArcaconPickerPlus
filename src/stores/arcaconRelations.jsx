import { STORAGE_ARCACON_DATA, STORAGE_FAVORITE_DATA, STORAGE_MEMO_DATA } from "../core/constants/config";
import { deleteData, getDatabase } from "./persistent";

const arcaconIDBTable = getDatabase(STORAGE_ARCACON_DATA);
const relatedIDBTable = [STORAGE_FAVORITE_DATA, STORAGE_MEMO_DATA].map(getDatabase);

// id가 관련 테이블에 참조되지 않으면 arcacon에서 삭제
export async function removeArcaconIfUnreferenced(id) {
  for (const dbTable of relatedIDBTable) {
    const item = await dbTable.get(id);
    if (item) {
      console.log(id, "is still referenced in", dbTable.name);
      return false;
    }
  }

  await deleteData(arcaconIDBTable, id);
  return true;
}
