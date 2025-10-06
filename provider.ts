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
    const queryParam = opts.query.toLowerCase();
    const url = `${this.baseUrl}/Find/${encodeURIComponent(queryParam)}`;

    const res = await fetch(url);
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const results: SearchResult[] = [];

    doc(".manga_search_item").each((i, el) => {
      const title = el.find("h3 a").first().text().trim();
      const link = el.find("a").first().attrs()["href"];
      const image = el.find("img").first().attrs()["src"];
      results.push({
        id: link.replace("/Manga/", ""),
        title,
        image: image.startsWith("http") ? image : this.baseUrl + image,
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
      const linkEl = el.find("td a").first();
      const link = linkEl.attrs()["href"];
      const title = linkEl.text().trim();
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
      const url = el.attrs()["src"];
      pages.push({
        url,
        index: i,
        headers: { Referer: this.baseUrl },
      });
    });

    return pages;
  }
}
