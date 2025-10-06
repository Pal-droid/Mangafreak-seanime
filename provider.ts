/// <reference path="./manga-provider.d.ts" />
import { load } from "cheerio";

class Provider {

    private baseUrl = "https://ww2.mangafreak.me";

    getSettings(): Settings {
        return {
            supportsMultiLanguage: false,
            supportsMultiScanlator: false,
        };
    }

    async search(opts: QueryOptions): Promise<SearchResult[]> {
        const res = await fetch(`${this.baseUrl}/Find/${encodeURIComponent(opts.query)}`);
        const html = await res.text();
        const $ = load(html);

        const results: SearchResult[] = [];

        $(".manga_search_item").each((i, el) => {
            const link = $(el).find("a").first().attr("href")!;
            const title = $(el).find("h3 a").text().trim();
            const image = $(el).find("img").attr("src") ?? "";
            results.push({
                id: link.replace("/Manga/", ""),
                title,
                image: image.startsWith("http") ? image : this.baseUrl + image,
            });
        });

        return results;
    }

    async findChapters(mangaId: string): Promise<ChapterDetails[]> {
        const res = await fetch(`${this.baseUrl}/Manga/${mangaId}`);
        const html = await res.text();
        const $ = load(html);

        const chapters: ChapterDetails[] = [];

        $("tr").each((i, el) => {
            const linkEl = $(el).find("td a");
            const link = linkEl.attr("href");
            const title = linkEl.text().trim();
            const date = $(el).find("td").eq(1).text().trim();

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
        const res = await fetch(`${this.baseUrl}/Read1_${chapterId}`);
        const html = await res.text();
        const $ = load(html);

        const pages: ChapterPage[] = [];

        $("div.image_orientation img").each((i, el) => {
            const url = $(el).attr("src")!;
            pages.push({
                url,
                index: i,
                headers: {
                    Referer: this.baseUrl,
                },
            });
        });

        return pages;
    }
}

export default Provider;
