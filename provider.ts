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

    console.log(`[Search] Querying URL: ${url}`);
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const results: SearchResult[] = [];

    doc(".manga_search_item").each((i, el) => {
      const linkEl = el.find("h3 a").first();
      if (!linkEl.length) return;

      const title = linkEl.text().trim();
      const link = linkEl.attrs()["href"];

      const imgEl = el.find("span a img").first();
      const imgSrc = imgEl.attrs()["src"] ?? "";

      if (link) {
        results.push({
          id: link.replace("/Manga/", ""),
          title,
          image: imgSrc.startsWith("http") ? imgSrc : this.baseUrl + imgSrc,
        });
      }
    });

    console.log(`[Search] Found ${results.length} results.`);
    return results;
  }

  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    const url = `${this.baseUrl}/Manga/${mangaId}`;
    console.log(`[FindChapters] Querying URL: ${url}`);

    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const chapters: ChapterDetails[] = [];

    // FIX: select all rows inside the table in the manga series list
    doc("div.manga_series_list table tr").each((i, el) => {
      const th = el.find("th");
      if (th.length) return; // skip header row

      const aEl = el.find("td a").first();
      if (!aEl.length) return;

      const link = aEl.attrs()["href"];
      const title = aEl.text().trim();
      const date = el.find("td").eq(1).text().trim();

      if (link) {
        // Updated regex: handles decimals and oneshots, drops 'e' if present
        const chapterNumber = title.match(/(\d+(\.\d+)?)/)?.[1] ?? "Oneshot";

        chapters.push({
          id: link.replace("/Read1_", ""),
          url: this.baseUrl + link,
          title,
          chapter: chapterNumber,
          index: 0,
          updatedAt: date,
        });
      }
    });

    // Sort ascending & reindex
    chapters.reverse();
    for (let i = 0; i < chapters.length; i++) {
      chapters[i].index = i;
    }

    console.log(`[FindChapters] Returning ${chapters.length} chapters in ascending order.`);
    return chapters;
  }

  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/Read1_${chapterId}`;
    console.log(`[FindChapterPages] Querying URL: ${url}`);

    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const pages: ChapterPage[] = [];

    doc("div.image_orientation img").each((i, el) => {
      const imgSrc = el.attrs()["src"];
      if (!imgSrc) return;

      pages.push({
        url: imgSrc.startsWith("http") ? imgSrc : this.baseUrl + imgSrc,
        index: i,
        headers: { Referer: url },
      });
    });

    return pages;
  }
}
