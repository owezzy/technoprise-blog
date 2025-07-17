import { Component, ViewEncapsulation, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogPost } from '../../models';
import { environment } from "../../../../../environments/environment";
import { LazyLoadImageModule } from 'ng-lazyload-image';

@Component({
    selector     : 'blog-detail',
    standalone   : true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        FuseAlertComponent,
        RouterLink,
        LazyLoadImageModule
    ],
    templateUrl  : './blog-detail.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailComponent
{
    @Input() blog: BlogPost | null = null;
    @Input() loading: boolean = false;
    @Input() error: string | null = null;

    // Placeholder image for lazy loading
    readonly placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzMgMTYwSDI2M1YxNDBIMTMzVjE2MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEzMyAxODBIMjEzVjE2MEgxMzNWMTgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTcwIDEyMEMyMTMuMDc2IDEyMCAyNzAgMTA5LjA3NiAyNzAgMTA5LjA3NkwyNzAgMTA5LjA3NkMxOTIuMDc2IDEyMCAxNzAgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDg3IDEwOS4wNzYgODcgMTA5LjA3NkM4NyAxMDkuMDc2IDE0Ni4wNzYgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDg3IDEwOS4wNzYgODcgMTA5LjA3NkM4NyAxMDkuMDc2IDE0Ni4wNzYgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxnPjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDEyMCAxMDkuMDc2IDEyMCAxMDkuMDc2QzEyMCAxMDkuMDc2IDEzMy4wNzYgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+PC9nPgo8L3N2Zz4K';

    /**
     * Constructor
     */
    constructor() {}

    /**
     * Get current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }


    /**
     * Get image URL
     */
    getImageUrl(filePath: string): string
    {
        return `${environment.BASE_URL}/images/${filePath}`;
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
        const words = content?.trim().split(/\s+/).length;
        const time = Math.ceil(words / wordsPerMinute);
        return Math.max(1, time);
    }

}
