/**
 * Seanime Extension for MangaFreak (Revised)
 * The class name MUST be 'Provider'.
 */
class Provider {

    // The base API URL for MangaFreak
    private api = 'https://ww2.mangafreak.me';

    getSettings() {
        return {
            supportsMultiLanguage: false,
            supportsMultiScanlator: false,
        };
    }

    /**
     * Searches for manga based on a query.
     */
    async search(opts) {
        const queryParam = opts.query;
        const url = `${this.api}/Find/${encodeURIComponent(queryParam)}`;

        try {
            const response = await fetch(url);
            const body = await response.text();
            // Assuming LoadDoc is available globally
            const doc = LoadDoc(body);
            
            // Selector for search results: div.manga_search_item within div.search_result
            let mangas = doc('div.search_result div.manga_search_item').map((index, element) => {
                const titleElement = element.find('span h3 a').first();
                const imageElement = element.find('span a img').first();

                const title = titleElement.text().trim();
                const mangaUrlSegment = titleElement.attrs()['href'];
                const mangaId = mangaUrlSegment.split('/Manga/')[1];
                const thumbnailUrl = imageElement.attrs()['src'];
                
                return {
                    id: mangaId,
                    title: title,
                    image: thumbnailUrl,
                };
            }).get();

            return mangas;
        }
        catch (e) {
            return [];
        }
    }

    /**
     * Finds the chapters for a given manga ID.
     */
    async findChapters(mangaId) {
        const url = `${this.api}/Manga/${mangaId}`;

        try {
            const response = await fetch(url);
            const body = await response.text();
            const doc = LoadDoc(body);

            let chapters = [];
            
            // Chapter links are in table.manga_chapters tr td a
            doc('table.manga_chapters tr td a').each((index, element) => {
                const linkElement = element.find('a').first();
                const titleWithDate = linkElement.text().trim();
                const fullUrl = linkElement.attrs()['href'];

                const chapterId = fullUrl.split('/')[1];

                const titleParts = titleWithDate.split(' - ');
                let chapterNumber = '0';
                
                if (titleParts.length > 0) {
                    const chapMatch = titleParts[0].match(/(\d+(\.\d+)?)/);
                    if (chapMatch) {
                        chapterNumber = chapMatch[0];
                    }
                }
                
                const chapterIndex = parseFloat(chapterNumber);

                chapters.push({
                    id: chapterId,
                    url: `${this.api}${fullUrl}`,
                    title: titleWithDate,
                    chapter: chapterNumber,
                    index: chapterIndex,
                });
            });
            
            // MangaFreak lists chapters in descending order, so we reverse them
            chapters.reverse();
            
            // Re-index to ensure the earliest chapter starts at index 0
            chapters.forEach((chapter, i) => {
                chapter.index = i;
            });
            
            return chapters;
        }
        catch (e) {
            return [];
        }
    }

    /**
     * Finds the pages for a given chapter ID.
     */
    async findChapterPages(chapterId) {
        const url = `${this.api}/${chapterId}`;
        const referer = url; 

        try {
            const response = await fetch(url);
            const body = await response.text();
            const doc = LoadDoc(body);
            
            let pages = [];

            // Images are in div.mySlides>img
            doc('div.mySlides.fade img').each((index, element) => {
                pages.push({
                    url: element.attrs()['src'],
                    index: index,
                    headers: {
                        'Referer': referer, 
                    },
                });
            });
            
            return pages;
        }
        catch (e) {
            return [];
        }
    }
}
