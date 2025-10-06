// MangaFreak provider for Seanime

class Provider {

    constructor() {
        this.baseUrl = "https://ww2.mangafreak.me";
    }

    getSettings() {
        return {
            supportsMultiLanguage: false,
            supportsMultiScanlator: false,
        };
    }

    async search(opts) {
        const res = await fetch(this.baseUrl + "/Find/" + encodeURIComponent(opts.query));
        const html = await res.text();
        const $ = cheerio.load(html);

        const results = [];

        $(".manga_search_item").each((i, el) => {
            const link = $(el).find("a").first().attr("href");
            const title = $(el).find("h3 a").text().trim();
            let image = $(el).find("img").attr("src") || "";
            if (image && !image.startsWith("http")) image = this.baseUrl + image;

            if (link) {
                results.push({
                    id: link.replace("/Manga/", ""),
                    title: title,
                    image: image,
                });
            }
        });

        return results;
    }

    async findChapters(mangaId) {
        const res = await fetch(this.baseUrl + "/Manga/" + mangaId);
        const html = await res.text();
        const $ = cheerio.load(html);

        const chapters = [];

        $("tr").each((i, el) => {
            const linkEl = $(el).find("td a");
            const link = linkEl.attr("href");
            const title = linkEl.text().trim();
            const date = $(el).find("td").eq(1).text().trim();

            if (link) {
                chapters.push({
                    id: link.replace("/Read1_", ""),
                    url: this.baseUrl + link,
                    title: title,
                    chapter: (title.match(/\d+/) || ["Oneshot"])[0],
                    index: i,
                    updatedAt: date,
                });
            }
        });

        return chapters;
    }

    async findChapterPages(chapterId) {
        const res = await fetch(this.baseUrl + "/Read1_" + chapterId);
        const html = await res.text();
        const $ = cheerio.load(html);

        const pages = [];

        $("div.image_orientation img").each((i, el) => {
            const url = $(el).attr("src");
            if (url) {
                pages.push({
                    url: url,
                    index: i,
                    headers: { Referer: this.baseUrl },
                });
            }
        });

        return pages;
    }
}
