import { MediaMap } from "~/app/_components/media-map";
import { TitleIndex } from "~/app/_components/title-index";

export default function Home() {
  return (
    <>
      <MediaMap />
      {/* Server-rendered, and only ever seen without JavaScript. See the
          component: the served document otherwise names none of the hundred
          titles the map is made of. */}
      <TitleIndex />
    </>
  );
}
