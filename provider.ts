/// <reference path="./manga-provider.d.ts" />

var load = window.cheerio || null; // Seanime provides cheerio via `window.cheerio`

class Provider {

    baseUrl = "https://ww2.mangafreak.me";

    getSettings() {
        return {
            supportsMultiLanguage: false,
            supportsMultiScanlator: false,
        };
    }

    async search(opts) {
        var res = await fetch(this.baseUrl + "/Find/" + encodeURIComponent(opts.query));
        var html = await res.text();
        var $ = load(html);

        var results = [];

        $(".manga_search_item").each(function(i, el) {
            var link = $(el).find("a").first().attr("href");
            var title = $(el).find("h3 a").text().trim();
            var image = $(el).find("img").attr("src") || "";
            results.push({
                id: link.replace("/Manga/", ""),
                title: title,
                image: image.startsWith("http") ? image : this.baseUrl + image,
            });
        }.bind(this));

        return results;
    }

    async findChapters(mangaId) {
        var res = await fetch(this.baseUrl + "/Manga/" + mangaId);
        var html = await res.text();
        var $ = load(html);

        var chapters = [];

        $("tr").each(function(i, el) {
            var linkEl = $(el).find("td a");
            var link = linkEl.attr("href");
            var title = linkEl.text().trim();
            var date = $(el).find("td").eq(1).text().trim();

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
        }.bind(this));

        return chapters;
    }

    async findChapterPages(chapterId) {
        var res = await fetch(this.baseUrl + "/Read1_" + chapterId);
        var html = await res.text();
        var $ = load(html);

        var pages = [];

        $("div.image_orientation img").each(function(i, el) {
            var url = $(el).attr("src");
            pages.push({
                url: url,
                index: i,
                headers: { Referer: this.baseUrl },
            });
        }.bind(this));

        return pages;
    }
}
