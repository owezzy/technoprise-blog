import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BlogSearchService } from './blog-search.service';
import { DeleteImageDialogComponent } from './delete-image-dialog.component';
import { Subject, takeUntil, switchMap, catchError, finalize, of, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';

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

interface BlogPostResponse {
  post: BlogPost;
}

@Component({
  selector: 'blog-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FuseAlertComponent
  ],
  templateUrl: './blog-edit.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class BlogEditComponent implements OnInit, OnDestroy {
  editForm: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;
  post: BlogPost | null = null;
  isNewPost = false;

  // Image upload properties
  selectedImage: File | null = null;
  featuredImagePreview: string | null = null;
  imageAltText: string = '';
  uploadingImage = false;
  imageToDelete: number | null = null; // Track image ID to delete
  deletingImage = false;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private blogSearchService: BlogSearchService,
    private dialog: MatDialog
  ) {
    this.createForm();
  }

  /**
   * On init
   */
  ngOnInit(): void {
    // Set search as inactive for edit page
    this.blogSearchService.setSearchActive(false);

    // Get post ID from route
    this.route.params
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(params => {
        if (params['id']) {
          this.loadPost(params['id']);
        } else {
          this.isNewPost = true;
          this.loading = false;
        }
      });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  /**
   * Create form
   */
  private createForm(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      slug: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      excerpt: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      content: ['', [Validators.required, Validators.minLength(50)]]
    });


    // Auto-generate slug from title
    this.editForm.get('title')?.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(title => {
        if (title && this.isNewPost) {
          const slug = this.generateSlug(title);
          this.editForm.get('slug')?.setValue(slug, { emitEvent: false });
        }
      });
  }

  /**
   * Load post by ID
   */
  loadPost(id: number): void {
    this.loading = true;
    this.error = null;

    this.http.get<BlogPostResponse>(`${environment.BASE_URL}/posts/${id}`)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (response) => {
          this.post = response.post;
          this.populateForm();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load blog post. Please try again later.';
          this.loading = false;
          console.error('Error loading post:', err);
        }
      });
  }

  /**
   * Populate form with post data
   */
  private populateForm(): void {
    if (this.post) {
      this.editForm.patchValue({
        title: this.post.title,
        slug: this.post.slug,
        excerpt: this.post.excerpt,
        content: this.post.content
      });

      // Set image alt text if featured image exists
      if (this.post.featured_image?.alt_text) {
        this.imageAltText = this.post.featured_image.alt_text;
      }
    }
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Save post
   */
  savePost(): void {
    if (this.editForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formData = this.editForm.value;
    const url = this.isNewPost
      ? `${environment.BASE_URL}/posts`
      : `${environment.BASE_URL}/posts/${this.post?.id}`;

    const method = this.isNewPost ? 'POST' : 'PATCH';

    // Save post first, then handle image operations
    this.http.request(method, url, {
      body: formData,
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        takeUntil(this._unsubscribeAll),
        switchMap((response: any) => {
          const postId = this.isNewPost ? response.post.id : this.post?.id;

          // Handle image upload if new image selected
          if (this.selectedImage && postId) {
            // If replacing existing image, delete the old one first
            if (this.post?.featured_image && !this.isNewPost) {
              return this.http.delete(`${environment.BASE_URL}/images/${this.post.featured_image.id}`).pipe(
                switchMap(() => this.uploadImage(postId)),
                switchMap(() => of(response)),
                catchError(err => {
                  console.error('Image replacement failed:', err);
                  this.snackBar.open('Post saved but image replacement failed', 'Close', { duration: 3000 });
                  return of(response);
                })
              );
            } else {
              return this.uploadImage(postId).pipe(
                switchMap(() => of(response)),
                catchError(err => {
                  console.error('Image upload failed:', err);
                  this.snackBar.open('Post saved but image upload failed', 'Close', { duration: 3000 });
                  return of(response);
                })
              );
            }
          }

          // Handle alt text update for existing image
          if (!this.selectedImage && this.post?.featured_image &&
              this.imageAltText !== this.post.featured_image.alt_text) {
            return this.updateImageAltText(this.post.featured_image.id).pipe(
              switchMap(() => of(response)),
              catchError(err => {
                console.error('Alt text update failed:', err);
                this.snackBar.open('Post saved but alt text update failed', 'Close', { duration: 3000 });
                return of(response);
              })
            );
          }

          return of(response);
        }),
        finalize(() => this.saving = false)
      )
      .subscribe({
        next: (response: any) => {
          this.snackBar.open(
            this.isNewPost ? 'Post created successfully!' : 'Post updated successfully!',
            'Close',
            { duration: 3000 }
          );

          // Navigate to post detail or back to list
          if (this.isNewPost && response.post) {
            this.router.navigate(['/blog', response.post.slug]);
          } else {
            this.router.navigate(['/blog']);
          }
        },
        error: (err) => {
          this.error = this.isNewPost
            ? 'Failed to create post. Please try again.'
            : 'Failed to update post. Please try again.';
          console.error('Error saving post:', err);
          this.snackBar.open(this.error, 'Close', { duration: 5000 });
        }
      });
  }

  /**
   * Update image alt text
   */
  private updateImageAltText(imageId: number) {
    const updateData = {
      alt_text: this.imageAltText
    };

    return this.http.patch(`${environment.BASE_URL}/images/${imageId}`, updateData)
      .pipe(takeUntil(this._unsubscribeAll));
  }

  /**
   * Cancel editing
   */
  cancel(): void {
    if (this.post) {
      this.router.navigate(['/blog', this.post.slug]);
    } else {
      this.router.navigate(['/blog']);
    }
  }

  /**
   * Mark all fields as touched for validation
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Get form field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  /**
   * Get field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      slug: 'Slug',
      excerpt: 'Excerpt',
      content: 'Content'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Handle image selection
   */
  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Please select a valid image file', 'Close', { duration: 3000 });
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('Image size must be less than 10MB', 'Close', { duration: 3000 });
        return;
      }

      this.selectedImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.featuredImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Remove featured image
   */
  removeFeaturedImage(): void {
    // Show confirmation dialog
    const dialogRef = this.dialog.open(DeleteImageDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User confirmed deletion
        if (this.post?.featured_image) {
          // Mark existing image for deletion
          this.imageToDelete = this.post.featured_image.id;
          this.deleteImageFromServer(this.post.featured_image.id);
        } else {
          // Just clear the selected image
          this.selectedImage = null;
          this.featuredImagePreview = null;
          this.imageAltText = '';
        }
      }
    });
  }

  /**
   * Delete image from server
   */
  private deleteImageFromServer(imageId: number): void {
    this.deletingImage = true;

    this.http.delete(`${environment.BASE_URL}/images/${imageId}`)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          // Clear the image from the post
          if (this.post?.featured_image) {
            this.post.featured_image = undefined;
          }
          this.selectedImage = null;
          this.featuredImagePreview = null;
          this.imageAltText = '';
          this.imageToDelete = null;
          this.deletingImage = false;

          this.snackBar.open('Image deleted successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.deletingImage = false;
          console.error('Error deleting image:', err);
          this.snackBar.open('Failed to delete image', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Upload image to server
   */
  private uploadImage(postId: number) {
    if (!this.selectedImage) {
      return of(null);
    }

    const formData = new FormData();
    formData.append('image', this.selectedImage);
    formData.append('alt_text', this.imageAltText);
    formData.append('is_featured', 'true');

    return this.http.post(`${environment.BASE_URL}/posts/${postId}/images`, formData)
      .pipe(takeUntil(this._unsubscribeAll));
  }

  /**
   * Replace existing image
   */
  replaceImage(): void {
    // Create a hidden file input to select new image
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.onchange = (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.snackBar.open('Please select a valid image file', 'Close', { duration: 3000 });
          return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          this.snackBar.open('Image size must be less than 10MB', 'Close', { duration: 3000 });
          return;
        }

        this.selectedImage = file;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.featuredImagePreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    };

    // Trigger file selection
    fileInput.click();
  }

  /**
   * Get image URL
   */
  getImageUrl(filename: string): string {
    return `${environment.BASE_URL}/images/${filename}`;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.error = null;
  }
}
