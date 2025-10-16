declare type SearchResult = {
    id: string
    title: string
    synonyms?: string[]
    year?: number
    image?: string
}

declare type ChapterDetails = {
    id: string
    url: string
    title: string
    chapter: string
    index: number
    scanlator?: string
    language?: string
    rating?: number
    updatedAt?: string
}

declare type ChapterPage = {
    url: string
    index: number
    headers: { [key: string]: string }
}

declare type QueryOptions = {
    query: string
    year?: number
}

declare type Settings = {
    supportsMultiLanguage?: boolean
    supportsMultiScanlator?: boolean
}


class Provider {
    // The base API URL for MangaFreak
    private api = 'https://ww2.mangafreak.me';

    /**
     * Gets the extension settings.
     * @returns {Settings} The supported settings.
     */
    getSettings(): Settings {
        // Based on the example, we'll keep these set to false
        return {
            [span_1](start_span)[span_2](start_span)supportsMultiLanguage: false, //[span_1](end_span)[span_2](end_span)
            [span_3](start_span)[span_4](start_span)supportsMultiScanlator: false, //[span_3](end_span)[span_4](end_span)
        };
    }

    /**
     * Searches for manga based on a query.
     * @param {QueryOptions} opts - The search query options.
     * @returns {Promise<SearchResult[]>} A promise that resolves to an array of search results.
     */
    async search(opts: QueryOptions): Promise<SearchResult[]> {
        const queryParam: string = opts.query;
        [span_5](start_span)// Search URL example: https://ww2.mangafreak.me/Find/nisekoi[span_5](end_span)
        const url = `${this.api}/Find/${encodeURIComponent(queryParam)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch search results: ${response.statusText}`); [span_6](start_span)//[span_6](end_span)
            }

            const body = await response.text();
            // Assuming LoadDoc is a global function available from the environment
            const doc: DocSelectionFunction = LoadDoc(body); [span_7](start_span)//[span_7](end_span)
            
            [span_8](start_span)// Selector for search results: div.manga_search_item within div.search_result[span_8](end_span)
            let mangas: SearchResult[] = doc('div.search_result div.manga_search_item').map((index, element) => {
                const titleElement = element.find('span h3 a').first(); // The title and main link
                const imageElement = element.find('span a img').first(); // The thumbnail image

                const title = titleElement.text().trim();
                // The URL is like /Manga/Nisekoi, so the ID is 'Nisekoi'
                const mangaUrlSegment = titleElement.attrs()['href'];
                const mangaId = mangaUrlSegment.split('/Manga/')[1];

                const thumbnailUrl = imageElement.attrs()['src'];
                
                [span_9](start_span)// Get the year from the completion text (if available) - not easily parsable from the HTML snippet[span_9](end_span)
                [span_10](start_span)[span_11](start_span)// For simplicity, we'll omit year and synonyms as they require more complex parsing or a secondary API call (like the AniList call in the example[span_10](end_span)[span_11](end_span))
                [span_12](start_span)// The provided HTML snippet only mentions chapter count and completion status[span_12](end_span)

                let mangaDetails: SearchResult = {
                    [span_13](start_span)id: mangaId, //[span_13](end_span)
                    [span_14](start_span)title: title, //[span_14](end_span)
                    [span_15](start_span)image: thumbnailUrl, //[span_15](end_span)
                };

                return mangaDetails;
            }).get(); // Use .get() to convert DocSelection to a native array

            [span_16](start_span)// MangaFreak returns a clean list, so no need for the unique-by-ID map from the example[span_16](end_span)
            return mangas;
        }
        catch (e: any) {
            console.error('MangaFreak search failed:', e); [span_17](start_span)//[span_17](end_span)
            return [];
        }
    }

    /**
     * Finds the chapters for a given manga ID.
     * @param {string} mangaId - The ID of the manga.
     * @returns {Promise<ChapterDetails[]>} A promise that resolves to an array of chapter details.
     */
    async findChapters(mangaId: string): Promise<ChapterDetails[]> {
        // Chapter list URL example: https://ww2.mangafreak.me/Manga/Nisekoi
        const url = `${this.api}/Manga/${mangaId}`; [span_18](start_span)//[span_18](end_span)

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch chapters: ${response.statusText}`); [span_19](start_span)//[span_19](end_span)
            }

            const body = await response.text();
            const doc: DocSelectionFunction = LoadDoc(body);

            let chapters: ChapterDetails[] = [];
            
            [span_20](start_span)// The chapter list is in a table, selecting the rows with chapter links: tr td a[span_20](end_span)
            doc('table.manga_chapters tr td a').each((index, element) => {
                const linkElement = element.find('a').first(); // The chapter link is the 'a' element itself
                const titleWithDate = linkElement.text().trim();
                
                [span_21](start_span)// The title is 'Chapter 1 - Promise'[span_21](end_span)
                [span_22](start_span)// The date is in the next <td>, but the example implementation[span_22](end_span) doesn't fetch `updatedAt` easily from this structure
                const fullUrl = linkElement.attrs()['href']; // Example: /Read1_Nisekoi_1

                [span_23](start_span)// Chapter ID construction: As suggested by the documentation, combine parts for the ID[span_23](end_span)
                // The unique ID will be the full path part that is used for reading: Read1_Nisekoi_1
                const chapterId = fullUrl.split('/')[1];

                // The title is "Chapter X - Title"
                const titleParts = titleWithDate.split(' - ');
                let chapterTitle = titleWithDate; // The full title
                let chapterNumber: string = '0';
                
                if (titleParts.length > 1) {
                    // Extract chapter number from 'Chapter 1'
                    const chapMatch = titleParts[0].match(/(\d+(\.\d+)?)/);
                    if (chapMatch) {
                        chapterNumber = chapMatch[0];
                        // The title without the 'Chapter X ' part
                        chapterTitle = titleWithDate; 
                    }
                }
                
                [span_24](start_span)// Index must be a number[span_24](end_span)
                const chapterIndex = parseFloat(chapterNumber);

                let chapterDetails: ChapterDetails = {
                    [span_25](start_span)id: chapterId, // Example: Read1_Nisekoi_1[span_25](end_span)
                    [span_26](start_span)url: `${this.api}${fullUrl}`, // Example: https://ww2.mangafreak.me/Read1_Nisekoi_1[span_26](end_span)
                    [span_27](start_span)title: chapterTitle, // Example: Chapter 1 - Promise[span_27](end_span)
                    [span_28](start_span)chapter: chapterNumber, // Example: 1[span_28](end_span)
                    [span_29](start_span)index: chapterIndex, //[span_29](end_span)
                };
                
                chapters.push(chapterDetails);
            });
            
            [span_30](start_span)// The documentation requires chapters to be sorted in ascending order (0, 1, ...)[span_30](end_span)
            [span_31](start_span)// MangaFreak lists chapters in descending order, so we need to reverse them[span_31](end_span)
            chapters.reverse();
            
            [span_32](start_span)// The index property is critical for sorting in the Seanime app[span_32](end_span)
            // We'll re-index after reversing to ensure they start from 0 for the earliest chapter.
            chapters.forEach((chapter, i) => {
                chapter.index = i;
            });
            
            return chapters;
        }
        catch (e: any) {
            console.error('MangaFreak findChapters failed:', e); [span_33](start_span)//[span_33](end_span)
            return [];
        }
    }

    /**
     * Finds the pages for a given chapter ID.
     * @param {string} chapterId - The ID of the chapter (e.g., Read1_Nisekoi_1).
     * @returns {Promise<ChapterPage[]>} A promise that resolves to an array of chapter pages.
     */
    async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
        // Chapter page URL example: https://ww2.mangafreak.me/Read1_Nisekoi_1
        const url = `${this.api}/${chapterId}`; [span_34](start_span)//[span_34](end_span)
        
        [span_35](start_span)[span_36](start_span)// MangaFreak requires a 'Referer' header[span_35](end_span)[span_36](end_span), but since we are fetching the HTML
        // page that contains the images, we just need the URL. The image source itself is absolute.
        [span_37](start_span)// We will set the Referer header on the ChapterPage object itself, pointing to the chapter page URL[span_37](end_span)
        const referer = url; 

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch chapter pages: ${response.statusText}`); [span_38](start_span)//[span_38](end_span)
            }

            const body = await response.text();
            const doc: DocSelectionFunction = LoadDoc(body);
            
            let pages: ChapterPage[] = [];

            [span_39](start_span)// The images are in div.mySlides>img[span_39](end_span)
            // Note: The HTML snippet shows multiple image containers, but only the one with the 'gohere' ID is shown
            // A more general selector for all images in the slideshow is needed. Assuming all images are within div.mySlides.
            doc('div.mySlides.fade img').each((index, element) => {
                let obj: ChapterPage = {
                    [span_40](start_span)url: element.attrs()['src'], // The direct image URL[span_40](end_span)
                    [span_41](start_span)index: index, // Page index (starts at 0)[span_41](end_span)
                    headers: {
                        [span_42](start_span)// Set the Referer header to the chapter URL, as is common for image hosts[span_42](end_span)
                        'Referer': referer, 
                    },
                };
                pages.push(obj);
            });
            
            [span_43](start_span)// The pages should be sorted in ascending order (0, 1, ...)[span_43](end_span)
            // Assuming the `doc().each()` processes them in order, this should be correct.
            return pages; [span_44](start_span)//[span_44](end_span)
        }
        catch (e: any) {
            console.error('MangaFreak findChapterPages failed:', e); [span_45](start_span)//[span_45](end_span)
            return [];
        }
    }
}
