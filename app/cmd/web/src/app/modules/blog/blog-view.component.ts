import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogState, BlogPost } from './blog.presenter';

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
        FuseAlertComponent
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
    @Input() getImageUrl!: (filename: string) => string;
    @Input() formatDate!: (dateString: string) => string;
    @Input() calculateReadingTime!: (content: string) => number;
    
    @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
    @Output() clearError = new EventEmitter<void>();

    // Make Math available in template
    Math = Math;

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