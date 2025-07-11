import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogSearchService } from './blog-search.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
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
    posts: BlogPost[] = [];
    loading = true;
    error: string | null = null;
    
    // Pagination
    currentPage = 1;
    pageSize = 9;
    totalRecords = 0;
    totalPages = 0;
    pageSizeOptions = [6, 9, 12, 18];
    
    // Getter for showing the paginator
    get showPaginator(): boolean {
        return !this.loading && (this.totalRecords > 0 || this.posts.length > 0);
    }
    
    // Search
    searchQuery = '';
    
    // Make Math available in template
    Math = Math;
    
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
        // Subscribe to route query parameters
        this.route.queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                this.currentPage = parseInt(params['page']) || 1;
                this.pageSize = parseInt(params['pageSize']) || 9;
                this.searchQuery = params['search'] || '';
                
                // Update search service with current search query
                this.blogSearchService.setSearchQuery(this.searchQuery);
                
                this.loadPosts();
            });

        // Subscribe to search query changes from the search service
        this.blogSearchService.searchQuery$
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe(query => {
                if (query !== this.searchQuery) {
                    this.searchQuery = query;
                    this.currentPage = 1;
                    this.updateUrl();
                }
            });

        // Set search as active for this page
        this.blogSearchService.setSearchActive(true);
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
     * Load posts from API
     */
    loadPosts(): void
    {
        this.loading = true;
        this.error = null;

        const params = new URLSearchParams({
            page: this.currentPage.toString(),
            page_size: this.pageSize.toString(),
            sort: '-published_at'
        });

        if (this.searchQuery.trim()) {
            params.append('title', this.searchQuery.trim());
        }

        this.http.get<BlogResponse>(`${environment.BASE_URL}/posts?${params}`)
            .subscribe({
                next: (response) => {
                    this.posts = response.posts || [];
                    this.totalRecords = response.metadata.total_records;
                    this.totalPages = response.metadata.last_page;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Failed to load blog posts. Please try again later.';
                    this.loading = false;
                    console.error('Error loading posts:', err);
                }
            });
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
        this.error = null;
    }

    /**
     * Handle page change event from Material Paginator
     */
    onPageChange(event: PageEvent): void
    {
        const newPage = event.pageIndex + 1; // Material paginator is 0-based
        const newPageSize = event.pageSize;
        
        // Update page size if changed
        if (newPageSize !== this.pageSize) {
            this.pageSize = newPageSize;
            this.currentPage = 1; // Reset to first page when changing page size
        } else {
            this.currentPage = newPage;
        }
        
        this.updateUrl();
        // Reload data immediately to reflect changes
        this.loadPosts();
    }

    /**
     * Get the current page index for Material Paginator (0-based)
     */
    getCurrentPageIndex(): number
    {
        return this.currentPage - 1;
    }

    /**
     * Get grid columns classes based on page size
     */
    getGridClasses(): string
    {
        const baseClasses = 'grid gap-8 blog-grid-transition';
        switch (this.pageSize) {
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
    }

    /**
     * Update URL with current search and page parameters
     */
    private updateUrl(): void
    {
        const queryParams: any = {};
        
        if (this.currentPage > 1) {
            queryParams.page = this.currentPage;
        }
        
        if (this.pageSize !== 9) {
            queryParams.pageSize = this.pageSize;
        }
        
        if (this.searchQuery.trim()) {
            queryParams.search = this.searchQuery.trim();
        }
        
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'replace'
        });
    }

}

