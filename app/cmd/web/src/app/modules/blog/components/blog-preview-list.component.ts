import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {CommonModule, JsonPipe, NgForOf, NgIf} from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import { BlogPost } from '../models';
import { environment } from "../../../../environments/environment";
import {BlogDetailComponent} from "./details/blog-detail.component";


@Component({
    standalone: true,
    selector: 'blog-preview',
    template: `
        <article class="blog-preview" [routerLink]="['/blog', post.slug]">
            <div class="blog-preview-card">
                <!-- Featured Image -->
                <div class="blog-preview-image">
                    <img
                        *ngIf="post.featured_image; else placeholderImage"
                        [src]="getImageUrl(post.featured_image.filename)"
                        [alt]="post.featured_image.alt_text || post.title"
                        loading="lazy"
                    />
                    <ng-template #placeholderImage>
                        <div class="placeholder-image">
                            <mat-icon>article</mat-icon>
                        </div>
                    </ng-template>

                    <!-- Reading Time Badge -->
                    <div class="reading-time">
                        {{ calculateReadingTime(post.content) }} min read
                    </div>

                    <!-- Edit Button -->
                    <button
                        mat-mini-fab
                        color="primary"
                        [routerLink]="['/blog/edit', post.id]"
                        (click)="$event.stopPropagation()"
                        class="edit-button"
                        aria-label="Edit post">
                        <mat-icon>edit</mat-icon>
                    </button>
                </div>

                <div class="blog-preview-content">
                    <!-- Publication Date -->
                    <div class="blog-preview-date">
                        <mat-icon>schedule</mat-icon>
                        {{ formatDate(post.published_at) }}
                    </div>

                    <!-- Title -->
                    <h2 class="blog-preview-title">{{ post.title }}</h2>

                    <!-- Excerpt -->
                    <p class="blog-preview-excerpt">{{ post.excerpt }}</p>

                    <!-- Read More Link -->
                    <div class="read-more">
                        <span>Read More</span>
                        <mat-icon>arrow_forward</mat-icon>
                    </div>
                </div>
            </div>
        </article>
    `,
    styles: [`
        .blog-preview {
            cursor: pointer;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .blog-preview:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .blog-preview-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .blog-preview-image {
            position: relative;
            aspect-ratio: 16/9;
            overflow: hidden;
            background: #f5f5f5;
        }

        .blog-preview-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .blog-preview:hover .blog-preview-image img {
            transform: scale(1.05);
        }

        .placeholder-image {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .placeholder-image mat-icon {
            font-size: 48px;
            height: 48px;
            width: 48px;
        }

        .reading-time {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(4px);
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        .edit-button {
            position: absolute;
            top: 12px;
            left: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .blog-preview:hover .edit-button {
            opacity: 1;
        }

        .blog-preview-content {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .blog-preview-date {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
        }

        .blog-preview-date mat-icon {
            font-size: 16px;
            height: 16px;
            width: 16px;
        }

        .blog-preview-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 12px 0;
            line-height: 1.3;
            color: #333;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .blog-preview-excerpt {
            font-size: 14px;
            line-height: 1.5;
            color: #666;
            margin: 0 0 16px 0;
            flex: 1;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .read-more {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #1976d2;
            font-weight: 500;
            font-size: 14px;
            margin-top: auto;
        }

        .read-more mat-icon {
            font-size: 16px;
            height: 16px;
            width: 16px;
            transition: transform 0.3s ease;
        }

        .blog-preview:hover .read-more mat-icon {
            transform: translateX(4px);
        }

        @media (max-width: 768px) {
            .blog-preview-content {
                padding: 16px;
            }

            .blog-preview-title {
                font-size: 18px;
            }

            .blog-preview-excerpt {
                font-size: 13px;
            }
        }
    `],
    imports: [
        RouterLink,
        MatIcon,
        CommonModule,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogPreviewComponent {
    @Input() post!: BlogPost;

    getImageUrl(filePath: string): string {
        return `${environment.BASE_URL}/images/${filePath}`;
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
}


@Component({
    selector: 'blog-preview-list',

    template: `
        <div class="blog-preview-list">
            <blog-preview
                *ngFor="let post of posts; trackBy: trackByPostId"
                [post]="post">
            </blog-preview>
        </div>
    `,
    styles: [`
        .blog-preview-list {
            display: grid;
            gap: 2rem;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            padding: 1rem 0;
        }

        @media (max-width: 768px) {
            .blog-preview-list {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
        }
    `],
    imports: [
        BlogPreviewComponent,
        NgForOf
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogPreviewListComponent {
  @Input() posts: BlogPost[] = [];

  trackByPostId(index: number, post: BlogPost): number {
    return post.id;
  }
}
