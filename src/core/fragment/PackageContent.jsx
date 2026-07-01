import { useArcaconStore } from "../../stores";

export default function PackageContent({ title, items }) {
  const { refreshArcaconItemsByEmoticonId } = useArcaconStore();

  const handleMediaError = (item) => {
    const emoticonid = item?.emoticonid;
    if (!emoticonid) return;
    void refreshArcaconItemsByEmoticonId(emoticonid);
  };

  return (
    <>
      <span className="package-title">{title}</span>
      <div className="thumbnails">
        {items.map((fav) => {
          return fav ? (
            <div
              key={`thumbnail-wrap-favorite-${fav.id}`}
              className="thumbnail-wrap loading"
              data-type={fav.type || ""}
              data-src={fav.imageUrl || ""}
              data-emoticon-id={fav.emoticonid || ""}
              data-attachment-id={fav.id || ""}
              data-poster={fav.poster || ""}
              data-orig={fav.orig || ""}
            >
              {fav.type === "video" ? (
                <video
                  className="thumbnail"
                  draggable="false"
                  data-attachmentid={fav.id || ""}
                  data-emoticonid={fav.emoticonid || ""}
                  src={`${fav.imageUrl || ""}`}
                  poster={`${fav.poster || ""}`}
                  data-orig={`${fav.orig || ""}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  onError={() => handleMediaError(fav)}
                ></video>
              ) : (
                <img
                  className="thumbnail"
                  draggable="false"
                  src={fav.imageUrl || ""}
                  data-emoticonid={fav.emoticonid || ""}
                  data-attachmentid={fav.id || ""}
                  onError={() => handleMediaError(fav)}
                />
              )}
            </div>
          ) : null;
        })}
      </div>
    </>
  );
}
