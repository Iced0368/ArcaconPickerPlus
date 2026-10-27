import {
  ContentCollector,
  FavoriteModule,
  MemoModule,
  FixerModule,
  SearchModule,
  ThumbnailOverlay,
  SettingsModule,
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
      <SettingsModule />
    </>
  );
}

export default App;
