/// <reference path="./manga-provider.d.ts" />
/// <reference path="./doc.d.ts" />

class Provider {
  private baseUrl = "https://ww2.mangafreak.me";

  getSettings(): Settings {
    return {
      supportsMultiLanguage: false,
      supportsMultiScanlator: false,
    };
  }

  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = opts.query.toLowerCase();
    const url = `${this.baseUrl}/Find/${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const results: SearchResult[] = [];

    doc(".manga_search_item").each((i, el) => {
      const linkEl = el.find("h3 a").first();
      const title = linkEl.text().trim();
      const link = linkEl.attrs()["href"]; // /Manga/Jujutsu_Kaisen

      // Fix image: inside the first <a> in <span>
      const imgEl = el.find("span a img").first();
      const imgSrc = imgEl.attrs()["src"] ?? "";

      results.push({
        id: link.replace("/Manga/", ""),
        title,
        image: imgSrc.startsWith("http") ? imgSrc : this.baseUrl + imgSrc,
      });
    });

    return results;
  }

  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    const url = `${this.baseUrl}/Manga/${mangaId}`;
    const res = await fetch(url);
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const chapters: ChapterDetails[] = [];

    doc("tr").each((i, el) => {
      const aEl = el.find("td a").first();
      const link = aEl.attrs()["href"]; // /Read1_Jujutsu_Kaisen_2
      const title = aEl.text().trim(); // Chapter 2 - Covert Execution
      const date = el.find("td").eq(1).text().trim();

      if (link) {
        chapters.push({
          id: link.replace("/Read1_", ""),
          url: this.baseUrl + link,
          title,
          chapter: title.match(/\d+/)?.[0] ?? "Oneshot",
          index: i,
          updatedAt: date,
        });
      }
    });

    return chapters;
  }

  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/Read1_${chapterId}`;
    const res = await fetch(url);
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const pages: ChapterPage[] = [];

    doc("div.image_orientation img").each((i, el) => {
      const src = el.attrs()["src"];
      if (src) {
        pages.push({
          url: src.startsWith("http") ? src : this.baseUrl + src,
          index: i,
          headers: { Referer: this.baseUrl },
        });
      }
    });

    return pages;
  }
}
