import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, takeUntil, Subject } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseLoadingService } from '@fuse/services/loading';
import { BlogPost } from '../models';
import * as fromBlog from '../reducers';
import { FindBlogPageActions } from '../actions/find-blog-page.actions';
import { BlogPreviewListComponent } from '../components/blog-preview-list.component';

@Component({
    selector: 'blog-container',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        FuseAlertComponent,
        BlogPreviewListComponent,
    ],
    templateUrl: './blog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogContainerComponent implements OnInit, OnDestroy {
    // Individual observables for template
    posts$: Observable<BlogPost[]>;
    loading$: Observable<boolean>;
    error$: Observable<string | null>;
    searchQuery$: Observable<string>;
    totalRecords$: Observable<number>;
    pageSize$: Observable<number>;
    currentPageIndex$: Observable<number>;
    showPaginator$: Observable<boolean>;

    pageSizeOptions = [6, 9, 12, 18];
    currentYear = new Date().getFullYear();

    private destroy$ = new Subject<void>();
    private _fuseLoadingService = inject(FuseLoadingService);

    constructor(
        private store: Store,
        private route: ActivatedRoute
    ) {
        // Set up observables from NgRx store
        this.posts$ = this.store.select(fromBlog.selectSearchResults);
        this.loading$ = this.store.select(fromBlog.selectSearchLoading);
        this.error$ = this.store.select(fromBlog.selectSearchError);
        this.searchQuery$ = this.store.select(fromBlog.selectSearchQuery);

        // Pagination observables from store
        this.totalRecords$ = this.store.select(fromBlog.selectSearchTotalRecords);
        this.pageSize$ = this.store.select(fromBlog.selectSearchPageSize);

        // Convert current page to zero-based index for Material paginator
        this.currentPageIndex$ = this.store.select(fromBlog.selectSearchCurrentPage).pipe(
            map(page => Math.max(0, page - 1))
        );

        this.showPaginator$ = this.totalRecords$.pipe(
            map(totalRecords => totalRecords > 0)
        );
    }

    ngOnInit(): void {
        // Subscribe to loading state and control FuseLoadingBar
        this.loading$
            .pipe(takeUntil(this.destroy$))
            .subscribe(loading => {
                if (loading) {
                    this._fuseLoadingService.show();
                } else {
                    this._fuseLoadingService.hide();
                }
            });

        // Check for URL parameters and load from URL if present
        const queryParams = this.route.snapshot.queryParams;
        const query = queryParams['q'] || '';
        const page = parseInt(queryParams['page'] || '1', 10);
        const pageSize = parseInt(queryParams['pageSize'] || '9', 10);

        if (query || page > 1 || pageSize !== 9) {
            // Load from URL parameters
            this.store.dispatch(FindBlogPageActions.loadFromURL({ query, page, pageSize }));
        } else {
            // Initialize with empty search to load all blogs
            this.store.dispatch(FindBlogPageActions.searchBlogs({ query: '', page: 1, pageSize: 9 }));
        }
    }

    ngOnDestroy(): void {
        // Ensure loading bar is hidden when component is destroyed
        this._fuseLoadingService.hide();
        this.destroy$.next();
        this.destroy$.complete();
    }

    onPageChange(event: PageEvent): void {
        // Convert zero-based index to one-based page number
        const page = event.pageIndex + 1;
        const pageSize = event.pageSize;

        this.store.dispatch(FindBlogPageActions.changePage({ page, pageSize, updateUrl: true }));
    }

    onClearError(): void {
        this.store.dispatch(FindBlogPageActions.clearError());
    }

    clearError(): void {
        this.onClearError();
    }


}
