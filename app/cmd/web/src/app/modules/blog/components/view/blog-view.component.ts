import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogPost } from '../../models';
import { LazyLoadImageModule } from 'ng-lazyload-image';

interface BlogState {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  searchQuery: string;
}

@Component({
    selector: 'blog-view',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        FuseAlertComponent,
        LazyLoadImageModule
    ],
    templateUrl: './blog-view.component.html',
    styleUrls: ['./blog-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BlogViewComponent {
    @Input() state: BlogState | null = null;
    @Input() pageSizeOptions!: number[];
    @Input() showPaginator!: boolean;
    @Input() currentPageIndex!: number;
    @Input() gridClasses!: string;
    @Input() getImageUrl!: (filePath: string) => string;
    @Input() formatDate!: (dateString: string) => string;
    @Input() calculateReadingTime!: (content: string) => number;

    @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
    @Output() clearError = new EventEmitter<void>();

    // Make Math available in template
    Math = Math;

    // Placeholder image for lazy loading
    readonly placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzMgMTYwSDI2M1YxNDBIMTMzVjE2MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEzMyAxODBIMjEzVjE2MEgxMzNWMTgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTcwIDEyMEMyMTMuMDc2IDEyMCAyNzAgMTA5LjA3NiAyNzAgMTA5LjA3NkwyNzAgMTA5LjA3NkMxOTIuMDc2IDEyMCAxNzAgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDg3IDEwOS4wNzYgODcgMTA5LjA3NkM4NyAxMDkuMDc2IDE0Ni4wNzYgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDg3IDEwOS4wNzYgODcgMTA5LjA3NkM4NyAxMDkuMDc2IDE0Ni4wNzYgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxnPjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDEyMCAxMDkuMDc2IDEyMCAxMDkuMDc2QzEyMCAxMDkuMDc2IDEzMy4wNzYgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+PC9nPgo8L3N2Zz4K';

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    /**
     * Handle page change event from Material Paginator
     */
    onPageChange(event: PageEvent): void {
        this.pageChange.emit({
            pageIndex: event.pageIndex,
            pageSize: event.pageSize
        });
    }

    /**
     * Track by function for posts
     */
    trackByPostId(index: number, post: BlogPost): number {
        return post.id;
    }

    /**
     * Clear error
     */
    onClearError(): void {
        this.clearError.emit();
    }
}
