import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogSearchService } from './blog-search.service';
import { BehaviorSubject, Subject, Observable, combineLatest, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import {environment} from "../../../environments/environment";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  version: number;
  featured_image?: {
    id: number;
    filename: string;
    file_path: string;
    alt_text?: string;
    caption?: string;
  };
}

interface BlogResponse {
  posts: BlogPost[];
  metadata: {
    current_page: number;
    page_size: number;
    first_page: number;
    last_page: number;
    total_records: number;
  };
}

@Component({
    selector     : 'blog',
    standalone   : true,
    imports: [
        CommonModule,
        AsyncPipe,
        RouterLink,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        FuseAlertComponent
    ],
    templateUrl  : './blog.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class BlogComponent implements OnInit, OnDestroy
{
    // BehaviorSubjects for state management
    private _posts$ = new BehaviorSubject<BlogPost[]>([]);
    private _loading$ = new BehaviorSubject<boolean>(true);
    private _error$ = new BehaviorSubject<string | null>(null);
    private _currentPage$ = new BehaviorSubject<number>(1);
    private _pageSize$ = new BehaviorSubject<number>(9);
    private _totalRecords$ = new BehaviorSubject<number>(0);
    private _totalPages$ = new BehaviorSubject<number>(0);
    private _searchQuery$ = new BehaviorSubject<string>('');
    
    // Reactive streams for template consumption
    posts$ = this._posts$.asObservable();
    loading$ = this._loading$.asObservable();
    error$ = this._error$.asObservable();
    currentPage$ = this._currentPage$.asObservable();
    pageSize$ = this._pageSize$.asObservable();
    totalRecords$ = this._totalRecords$.asObservable();
    totalPages$ = this._totalPages$.asObservable();
    searchQuery$ = this._searchQuery$.asObservable();
    
    // Derived streams
    showPaginator$ = combineLatest([this.loading$, this.totalRecords$, this.posts$]).pipe(
        map(([loading, totalRecords, posts]) => !loading && (totalRecords > 0 || posts.length > 0))
    );
    
    currentPageIndex$ = this.currentPage$.pipe(map(page => page - 1));
    
    gridClasses$ = this.pageSize$.pipe(
        map(pageSize => {
            const baseClasses = 'grid gap-8 blog-grid-transition';
            switch (pageSize) {
                case 6:
                    return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
                case 9:
                    return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
                case 12:
                    return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
                case 18:
                    return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6`;
                default:
                    return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
            }
        })
    );
    
    // Constants
    readonly pageSizeOptions = [6, 9, 12, 18];
    readonly Math = Math;
    
    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router,
        private blogSearchService: BlogSearchService
    )
    {
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Set search as active for this page
        this.blogSearchService.setSearchActive(true);
        
        // Handle route parameter changes
        this.route.queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                this._currentPage$.next(parseInt(params['page']) || 1);
                this._pageSize$.next(parseInt(params['pageSize']) || 9);
                this._searchQuery$.next(params['search'] || '');
                
                // Update search service with current search query
                this.blogSearchService.setSearchQuery(params['search'] || '');
            });

        // Handle search query changes from the search service
        this.blogSearchService.searchQuery$
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe(query => {
                if (query !== this._searchQuery$.value) {
                    this._searchQuery$.next(query);
                    this._currentPage$.next(1);
                    this.updateUrl();
                }
            });

        // Load posts reactively based on state changes
        combineLatest([
            this._currentPage$,
            this._pageSize$,
            this._searchQuery$
        ]).pipe(
            takeUntil(this._unsubscribeAll),
            debounceTime(100),
            switchMap(([currentPage, pageSize, searchQuery]) => {
                this._loading$.next(true);
                this._error$.next(null);
                
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    page_size: pageSize.toString(),
                    sort: '-published_at'
                });

                if (searchQuery.trim()) {
                    params.append('title', searchQuery.trim());
                }

                return this.http.get<BlogResponse>(`${environment.BASE_URL}/posts?${params}`);
            })
        ).subscribe({
            next: (response) => {
                this._posts$.next(response.posts || []);
                this._totalRecords$.next(response.metadata.total_records);
                this._totalPages$.next(response.metadata.last_page);
                this._loading$.next(false);
            },
            error: (err) => {
                this._error$.next('Failed to load blog posts. Please try again later.');
                this._loading$.next(false);
                console.error('Error loading posts:', err);
            }
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Set search as inactive when leaving this page
        this.blogSearchService.setSearchActive(false);
        
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }


    /**
     * Get image URL
     */
    getImageUrl(filename: string): string
    {
        return `${environment.BASE_URL}/images/${filename}`;
    }

    /**
     * Format date string
     */
    formatDate(dateString: string): string
    {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calculate reading time
     */
    calculateReadingTime(content: string): number
    {
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        const time = Math.ceil(words / wordsPerMinute);
        return Math.max(1, time);
    }

    /**
     * Track by function for posts
     */
    trackByPostId(index: number, post: BlogPost): number
    {
        return post.id;
    }

    /**
     * Clear error
     */
    clearError(): void
    {
        this._error$.next(null);
    }

    /**
     * Handle page change event from Material Paginator
     */
    onPageChange(event: PageEvent): void
    {
        const newPage = event.pageIndex + 1; // Material paginator is 0-based
        const newPageSize = event.pageSize;
        
        // Update page size if changed
        if (newPageSize !== this._pageSize$.value) {
            this._pageSize$.next(newPageSize);
            this._currentPage$.next(1); // Reset to first page when changing page size
        } else {
            this._currentPage$.next(newPage);
        }
        
        this.updateUrl();
    }

    /**
     * Update URL with current search and page parameters
     */
    private updateUrl(): void
    {
        const queryParams: any = {};
        const currentPage = this._currentPage$.value;
        const pageSize = this._pageSize$.value;
        const searchQuery = this._searchQuery$.value;
        
        if (currentPage > 1) {
            queryParams.page = currentPage;
        }
        
        if (pageSize !== 9) {
            queryParams.pageSize = pageSize;
        }
        
        if (searchQuery.trim()) {
            queryParams.search = searchQuery.trim();
        }
        
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'replace'
        });
    }

}

