import RefreshIcon from "../../assets/refresh-icon.svg?react";

import "./view.css";
import { useArcaconStore } from "../../stores";
import { useState } from "react";
import { PickerPortalList } from "../../core/utils";

export default function FixerView({ pickers }) {
  const { getArcaconById, setArcaconItem } = useArcaconStore();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const refreshArcacon = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);

    const data = await fetch("/api/emoticon")
      .then((res) => res.json())
      .catch((error) => {
        console.error("[ArcaconPickerPlus] Failed to fetch emoticon data: ", error);
      });

    let completed = 0;
    const total = data.length;

    await Promise.all(
      data.map((pack) => {
        if (pack.id <= 0) {
          completed++;
          setProgress(Math.round((completed / total) * 100));
          return;
        }
        return fetch(`/api/emoticon2/${pack.id}`)
          .then((response) => response.json())
          .then((emoticonData) => {
            emoticonData.forEach((arcacon) => {
              if (getArcaconById(arcacon.id.toString(), true)) {
                const newItem = { ...arcacon, id: arcacon.id.toString(), emoticonid: pack.id.toString() };
                setArcaconItem(newItem, true);
              }
            });
          })
          .catch((error) => {
            console.error("[ArcaconPickerPlus] Failed to refresh arcacon item: ", pack.id, error);
          })
          .finally(() => {
            completed++;
            setProgress(Math.round((completed / total) * 100));
          });
      }),
    );

    setIsLoading(false);
    setProgress(100);
    alert("[ArcaconPickerPlus] Arcacon data refresh completed.");
    window.location.reload();
  };

  return (
    <>
      <PickerPortalList
        pickers={pickers}
        getTarget={(picker) => picker.titleArea?.firstChild}
        getKey={(picker) => `fixer-${picker.uid}`}
        render={() => (
          <button className="refresh-btn" onClick={refreshArcacon} disabled={isLoading}>
            <span>갱신</span>
            <RefreshIcon />
            {isLoading && <span style={{ marginLeft: 8 }}>{progress}%</span>}
          </button>
        )}
      />
    </>
  );
}
