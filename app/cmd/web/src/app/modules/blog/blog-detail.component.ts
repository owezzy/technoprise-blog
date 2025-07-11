import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogSearchService } from './blog-search.service';
import { environment } from "../../../environments/environment";

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

@Component({
    selector     : 'blog-detail',
    standalone   : true,
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        FuseAlertComponent,
        RouterLink
    ],
    templateUrl  : './blog-detail.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class BlogDetailComponent implements OnInit, OnDestroy
{
    post: BlogPost | null = null;
    loading = true;
    error: string | null = null;

    /**
     * Constructor
     */
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private blogSearchService: BlogSearchService
    )
    {
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Hide search on detail page
        this.blogSearchService.setSearchActive(false);

        this.route.paramMap.subscribe(params => {
            const slug = params.get('slug');
            if (slug) {
                this.loadPostBySlug(slug);
            } else {
                this.error = 'Invalid blog post URL';
                this.loading = false;
            }
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Search will be reactivated by the blog list component if navigating back
    }
    
    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    /**
     * Load post by slug from API
     */
    loadPostBySlug(slug: string): void
    {
        this.loading = true;
        this.error = null;

        this.http.get<{post: BlogPost}>(`${environment.BASE_URL}/slug/${slug}`)
            .subscribe({
                next: (response) => {
                    this.post = response.post;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.status === 404
                        ? 'Blog post not found'
                        : 'Failed to load blog post. Please try again later.';
                    this.loading = false;
                    console.error('Error loading post:', err);
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
     * Navigate back to blog list
     */
    navigateBack(): void
    {
        this.router.navigate(['/blog']);
    }

    /**
     * Clear error
     */
    clearError(): void
    {
        this.error = null;
    }
}
