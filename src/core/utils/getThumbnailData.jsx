export function getThumbnailAttachmentId(node) {
  return node?.getAttribute("data-attachment-id") || null;
}

export function getThumbnailArcaconItem(node) {
  if (!node) return null;

  return {
    id: getThumbnailAttachmentId(node),
    emoticonid: node.getAttribute("data-emoticon-id"),
    imageUrl: node.getAttribute("data-src"),
    type: node.getAttribute("data-type"),
    poster: node.getAttribute("data-poster"),
    orig: node.getAttribute("data-orig"),
  };
}
