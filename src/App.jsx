import {
  ContentCollector,
  FavoriteModule,
  MemoModule,
  FixerModule,
  SearchModule,
  ThumbnailOverlay,
  BackupModule,
  FrequentModule,
} from "./modules";

function App() {
  return (
    <>
      <ContentCollector />
      <ThumbnailOverlay />

      <FavoriteModule />
      <FrequentModule />
      <MemoModule />
      <SearchModule />
      <FixerModule />
      <BackupModule />
    </>
  );
}

export default App;
