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

  // Returns the search results based on the query.
  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = opts.query.toLowerCase();
    const url = `${this.baseUrl}/Find/${encodeURIComponent(query)}`;
    
    // LOG: Start search
    console.log(`[Search] Querying URL: ${url}`);

    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const results: SearchResult[] = [];

    doc(".manga_search_item").each((i, el) => {
      const linkEl = el.find("h3 a").first();
      const title = linkEl.text().trim();
      const link = linkEl.attrs()["href"]; // Example: /Manga/Jujutsu_Kaisen

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

    // LOG: Search results count
    console.log(`[Search] Found ${results.length} results.`);
    return results;
  }

  // Returns the chapters based on the manga ID.
  // The chapters should be sorted in ascending order (0, 1, ...).
  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    const url = `${this.baseUrl}/Manga/${mangaId}`;
    
    // LOG: Start finding chapters
    console.log(`[FindChapters] Querying URL: ${url}`);
    
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const chapters: ChapterDetails[] = [];
    
    // Select all chapter rows
    doc("tr").each((i, el) => {
      const aEl = el.find("td a").first();
      const link = aEl.attrs()["href"]; // Example: /Read1_Jujutsu_Kaisen_2
      const title = aEl.text().trim(); // Example: Chapter 2 - Covert Execution
      const date = el.find("td").eq(1).text().trim();

      if (link) {
        const chapterNumber = title.match(/(\d+(\.\d+)?|\d+e)/)?.[1] ?? "Oneshot";
        
        chapters.push({
          id: link.replace("/Read1_", ""), 
          url: this.baseUrl + link,
          title,
          chapter: chapterNumber.replace('e', ''), 
          index: 0, 
          updatedAt: date,
        });
      }
    });

    // LOG: Chapters found before processing
    console.log(`[FindChapters] Found ${chapters.length} chapters on page.`);

    // REVERSE and RE-INDEX
    chapters.reverse();
    for (let i = 0; i < chapters.length; i++) {
        chapters[i].index = i;
    }
    
    // LOG: Chapters returned
    console.log(`[FindChapters] Returning ${chapters.length} chapters in ascending order.`);
    return chapters;
  }

  // Returns the chapter pages based on the chapter ID.
  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    const url = `${this.baseUrl}/Read1_${chapterId}`;
    
    // LOG: Start finding chapter pages
    console.log(`[FindChapterPages] Querying URL: ${url}`);
    
    const res = await fetch(url, { redirect: "follow" });
    const body = await res.text();
    const doc: DocSelectionFunction = LoadDoc(body);

    const pages: ChapterPage[] = [];

    // All pages are <img> tags inside a <div> with class "image_orientation"
    doc("div.image_orientation img").each((i, el) => {
      const imgSrc = el.attrs()["src"];

      if (imgSrc) {
        pages.push({
          url: imgSrc.startsWith("http") ? imgSrc : this.baseUrl + imgSrc,
          index: i,
          // The website requires a Referer header
          headers: {
            Referer: url,
          },
        });
      }
    });

    // LOG: Pages found
    console.log(`[FindChapterPages] Found ${pages.length} pages.`);
    return pages;
  }
}
