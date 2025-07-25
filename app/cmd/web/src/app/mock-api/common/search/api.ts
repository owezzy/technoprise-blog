import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    FuseNavigationItem,
    FuseNavigationService,
} from '@fuse/components/navigation';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { contacts } from 'app/mock-api/apps/contacts/data';
import { tasks } from 'app/mock-api/apps/tasks/data';
import { defaultNavigation } from 'app/mock-api/common/navigation/data';
import { environment } from 'environments/environment';
import { cloneDeep } from 'lodash-es';

@Injectable({ providedIn: 'root' })
export class SearchMockApi {
    private readonly _defaultNavigation: FuseNavigationItem[] =
        defaultNavigation;
    private readonly _contacts: any[] = contacts;
    private readonly _tasks: any[] = tasks;

    /**
     * Constructor
     */
    constructor(
        private _fuseMockApiService: FuseMockApiService,
        private _fuseNavigationService: FuseNavigationService,
        private _httpClient: HttpClient
    ) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // Get the flat navigation and store it
        const flatNavigation = this._fuseNavigationService.getFlatNavigation(
            this._defaultNavigation
        );

        // -----------------------------------------------------------------------------------------------------
        // @ Search results - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/common/search')
            // @ts-ignore
            .reply(async ({ request }) => {
                // Get the search query
                const query = cloneDeep(request.body.query.toLowerCase());

                // If the search query is an empty string,
                // return an empty array
                if (query === '') {
                    return [200, { results: [] }];
                }

                // Filter the contacts
                const contactsResults = cloneDeep(this._contacts).filter(
                    (contact) => contact.name.toLowerCase().includes(query)
                );

                // Filter the navigation
                const pagesResults = cloneDeep(flatNavigation).filter(
                    (page) =>
                        page.title?.toLowerCase().includes(query) ||
                        (page.subtitle && page.subtitle.includes(query))
                );

                // Filter the tasks
                const tasksResults = cloneDeep(this._tasks).filter((task) =>
                    task.title.toLowerCase().includes(query)
                );

                // Search blog posts
                let blogResults = [];
                try {
                    const blogResponse = await this._httpClient.get<any>(
                        `${environment.BASE_URL}/posts?title=${encodeURIComponent(query)}&page_size=5`
                    ).toPromise();

                    if (blogResponse && blogResponse.posts) {
                        blogResults = blogResponse.posts.slice(0, 5); // Limit to 5 results
                    }
                } catch (error) {
                    console.warn('Blog search failed:', error);
                }

                // Prepare the results array
                const results = [];

                // If there are contacts results...
                if (contactsResults.length > 0) {
                    // Normalize the results
                    contactsResults.forEach((result) => {
                        // Add a link
                        result.link = '/apps/contacts/' + result.id;

                        // Add the name as the value
                        result.value = result.name;
                    });

                    // Add to the results
                    results.push({
                        id: 'contacts',
                        label: 'Contacts',
                        results: contactsResults,
                    });
                }

                // If there are page results...
                if (pagesResults.length > 0) {
                    // Normalize the results
                    pagesResults.forEach((result: any) => {
                        // Add the page title as the value
                        result.value = result.title;
                    });

                    // Add to the results
                    results.push({
                        id: 'pages',
                        label: 'Pages',
                        results: pagesResults,
                    });
                }

                // If there are tasks results...
                if (tasksResults.length > 0) {
                    // Normalize the results
                    tasksResults.forEach((result) => {
                        // Add a link
                        result.link = '/apps/tasks/' + result.id;

                        // Add the title as the value
                        result.value = result.title;
                    });

                    // Add to the results
                    results.push({
                        id: 'tasks',
                        label: 'Tasks',
                        results: tasksResults,
                    });
                }

                // If there are blog results...
                if (blogResults.length > 0) {
                    // Normalize the results
                    blogResults.forEach((result) => {
                        // Add a link
                        result.link = '/blog/' + result.slug;

                        // Add the title as the value
                        result.value = result.title;
                    });

                    // Add to the results
                    results.push({
                        id: 'blog',
                        label: 'Blog Posts',
                        results: blogResults,
                    });
                }

                // Return the response
                return [200, results];
            });
    }
}
