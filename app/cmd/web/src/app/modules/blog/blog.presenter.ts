import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { BlogSearchService } from './blog-search.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BlogPost {
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

export interface BlogResponse {
    posts: BlogPost[];
    metadata: {
        current_page: number;
        page_size: number;
        first_page: number;
        last_page: number;
        total_records: number;
    };
}

export interface BlogState {
    posts: BlogPost[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    searchQuery: string;
}

@Injectable()
export class BlogPresenter {
    private _destroy$ = new Subject<void>();
    private _stateSubject = new BehaviorSubject<BlogState>({
        posts: [],
        loading: true,
        error: null,
        currentPage: 1,
        pageSize: 9,
        totalRecords: 0,
        totalPages: 0,
        searchQuery: ''
    });

    readonly pageSizeOptions = [6, 9, 12, 18];
    readonly state$ = this._stateSubject.asObservable();

    constructor(
        private _http: HttpClient,
        private _router: Router,
        private _route: ActivatedRoute,
        private _blogSearchService: BlogSearchService
    ) {}

    get state(): BlogState {
        return this._stateSubject.value;
    }

    initialize(): void {
        this._subscribeToRouteParams();
        this._subscribeToSearchQuery();
        this._blogSearchService.setSearchActive(true);
    }

    destroy(): void {
        this._blogSearchService.setSearchActive(false);
        this._destroy$.next();
        this._destroy$.complete();
        this._stateSubject.complete();
    }

    loadPosts(): Observable<BlogResponse> {
        return this._loadPosts();
    }

    private _loadPosts(): Observable<BlogResponse> {
        this._updateState({ loading: true, error: null });

        const currentState = this._stateSubject.value;
        const params = new URLSearchParams({
            page: currentState.currentPage.toString(),
            page_size: currentState.pageSize.toString(),
            sort: '-published_at'
        });

        if (currentState.searchQuery.trim()) {
            params.append('title', currentState.searchQuery.trim());
        }

        const request = this._http.get<BlogResponse>(`${environment.BASE_URL}/posts?${params}`);
        
        // Subscribe to the request and handle success/error automatically
        request.subscribe({
            next: (response) => this.handleLoadSuccess(response),
            error: (error) => this.handleLoadError(error)
        });

        return request;
    }

    handleLoadSuccess(response: BlogResponse): void {
        this._updateState({
            posts: response.posts || [],
            totalRecords: response.metadata.total_records,
            totalPages: response.metadata.last_page,
            loading: false
        });
    }

    handleLoadError(error: any): void {
        this._updateState({
            error: 'Failed to load blog posts. Please try again later.',
            loading: false
        });
        console.error('Error loading posts:', error);
    }

    onPageChange(pageIndex: number, pageSize: number): void {
        const newPage = pageIndex + 1; // Material paginator is 0-based
        const currentState = this._stateSubject.value;
        
        if (pageSize !== currentState.pageSize) {
            this._updateState({ pageSize, currentPage: 1 });
        } else {
            this._updateState({ currentPage: newPage });
        }
        
        this._updateUrl();
        // Trigger data load when page changes
        this._loadPosts();
    }

    clearError(): void {
        this._updateState({ error: null });
    }

    getImageUrl(filename: string): string {
        return `${environment.BASE_URL}/images/${filename}`;
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    calculateReadingTime(content: string): number {
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        const time = Math.ceil(words / wordsPerMinute);
        return Math.max(1, time);
    }

    getGridClasses(): string {
        const baseClasses = 'grid gap-8 blog-grid-transition';
        const currentState = this._stateSubject.value;
        switch (currentState.pageSize) {
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

    get showPaginator(): boolean {
        const currentState = this._stateSubject.value;
        return !currentState.loading && (currentState.totalRecords > 0 || currentState.posts.length > 0);
    }

    get currentPageIndex(): number {
        return this._stateSubject.value.currentPage - 1;
    }

    private _subscribeToRouteParams(): void {
        this._route.queryParams
            .pipe(takeUntil(this._destroy$))
            .subscribe(params => {
                this._updateState({
                    currentPage: parseInt(params['page']) || 1,
                    pageSize: parseInt(params['pageSize']) || 9,
                    searchQuery: params['search'] || ''
                });
                
                this._blogSearchService.setSearchQuery(this._stateSubject.value.searchQuery);
                // Trigger data load when route params change
                this._loadPosts();
            });
    }

    private _subscribeToSearchQuery(): void {
        this._blogSearchService.searchQuery$
            .pipe(
                takeUntil(this._destroy$),
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe(query => {
                if (query !== this._stateSubject.value.searchQuery) {
                    this._updateState({
                        searchQuery: query,
                        currentPage: 1
                    });
                    this._updateUrl();
                    // Trigger data reload when search query changes
                    this._loadPosts();
                }
            });
    }

    private _updateState(partial: Partial<BlogState>): void {
        const currentState = this._stateSubject.value;
        const newState = { ...currentState, ...partial };
        this._stateSubject.next(newState);
    }

    private _updateUrl(): void {
        const queryParams: any = {};
        const currentState = this._stateSubject.value;
        
        if (currentState.currentPage > 1) {
            queryParams.page = currentState.currentPage;
        }
        
        if (currentState.pageSize !== 9) {
            queryParams.pageSize = currentState.pageSize;
        }
        
        if (currentState.searchQuery.trim()) {
            queryParams.search = currentState.searchQuery.trim();
        }
        
        this._router.navigate([], {
            relativeTo: this._route,
            queryParams: queryParams,
            queryParamsHandling: 'replace'
        });
    }
}