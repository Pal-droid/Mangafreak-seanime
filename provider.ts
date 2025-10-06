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

  // 🔍 Search for manga
  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = opts.query.toLowerCase();
    const url = `${this.baseUrl}/Find/${encodeURIComponent(query)}`;
    console.log(`[Search] Querying URL: ${url}`);

    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();

    if (!body || body.includes("Cloudflare") || body.includes("Just a moment")) {
      console.log("[Search] Cloudflare or invalid response detected.");
      return [];
    }

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

  // 📜 Get all chapters of a manga
  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    const url = `${this.baseUrl}/Manga/${mangaId}`;
    console.log(`[FindChapters] Querying URL: ${url}`);

    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();

    if (!body || body.includes("Cloudflare") || body.includes("Just a moment")) {
      console.log("[FindChapters] Cloudflare or invalid response detected.");
      return [];
    }

    const doc: DocSelectionFunction = LoadDoc(body);
    const chapters: ChapterDetails[] = [];

    // ✅ Correct selector for your provided HTML
    doc("div.manga_series_list_section table tr").each((i, el) => {
      const th = el.find("th");
      if (th.length) return; // skip table header row

      const linkEl = el.find("a").first();
      const dateEl = el.find("td").eq(1);

      if (!linkEl.length) return;

      const link = linkEl.attrs()["href"];
      const title = linkEl.text().trim();
      const date = dateEl.text().trim();

      if (!link) return;

      // Extract number like "1", "2.5", etc.
      const chapterNumber = title.match(/(\d+(\.\d+)?)/)?.[1] ?? "Oneshot";

      chapters.push({
        id: link.replace("/Read1_", ""),
        url: this.baseUrl + link,
        title,
        chapter: chapterNumber,
        index: 0,
        updatedAt: date,
      });
    });

    chapters.reverse().forEach((ch, i) => (ch.index = i));
    console.log(`[FindChapters] Found ${chapters.length} chapters.`);
    return chapters;
  }

  // 📖 Get all pages of a chapter
  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/Read1_${chapterId}`;
    console.log(`[FindChapterPages] Querying URL: ${url}`);

    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();

    if (!body || body.includes("Cloudflare") || body.includes("Just a moment")) {
      console.log("[FindChapterPages] Cloudflare or invalid response detected.");
      return [];
    }

    const doc: DocSelectionFunction = LoadDoc(body);
    const pages: ChapterPage[] = [];

    // ✅ Matches: <div class="image_orientation"><img src="..." /></div>
    doc("div.image_orientation img").each((i, el) => {
      const imgSrc = el.attrs()["src"];
      if (!imgSrc) return;

      pages.push({
        url: imgSrc.startsWith("http") ? imgSrc : this.baseUrl + imgSrc,
        index: i,
        headers: { Referer: url },
      });
    });

    console.log(`[FindChapterPages] Found ${pages.length} pages.`);
    return pages;
  }
}