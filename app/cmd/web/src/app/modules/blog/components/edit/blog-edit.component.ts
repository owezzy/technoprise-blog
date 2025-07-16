import { Component, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { BlogPost } from '../../models';
import { DeleteImageDialogComponent } from '../delete-image-dialog.component';
import { FuseAlertComponent } from "../../../../../@fuse/components/alert";
import { environment } from "../../../../../environments/environment";
import { LazyLoadImageModule } from 'ng-lazyload-image';

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
        MatDialogModule,
        FuseAlertComponent,
        LazyLoadImageModule
    ],
  templateUrl: './blog-edit.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogEditComponent implements OnInit, OnDestroy, OnChanges {
  @Input() blog: { post: BlogPost } | null = null;
  @Input() loading: boolean = false;
  @Input() saving: boolean = false;
  @Input() error: string | null = null;
  @Input() uploadingImage: boolean = false;
  @Input() imageUploadError: string | null = null;
  @Input() isEditMode: boolean = false;

  @Output() save = new EventEmitter<Partial<BlogPost>>();
  @Output() update = new EventEmitter<Partial<BlogPost>>();
  @Output() delete = new EventEmitter<number>();
  @Output() uploadImage = new EventEmitter<{ file: File, id:number }>();
  @Output() deleteImage = new EventEmitter<number>();

  editForm: FormGroup;

  // Image upload properties
  selectedImage: File | null = null;
  featuredImagePreview: string | null = null;

  // Placeholder image for lazy loading
  readonly placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzMgMTYwSDI2M1YxNDBIMTMzVjE2MFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTEzMyAxODBIMjEzVjE2MEgxMzNWMTgwWiIgZmlsbD0iI0QxRDVEQiIvPgo8cGF0aCBkPSJNMTcwIDEyMEMyMTMuMDc2IDEyMCAyNzAgMTA5LjA3NiAyNzAgMTA5LjA3NkwyNzAgMTA5LjA3NkMxOTIuMDc2IDEyMCAxNzAgMTIwIDE3MCAxMjBaIiBmaWxsPSIjRDFENURCIi8+CjxwYXRoIGQ9Ik0xNzAgMTIwQzEzMy4wNzYgMTIwIDg3IDEwOS4wNzYgODcgMTA5LjA3Nkw4NyAxMDkuMDc2QzE0Ni4wNzYgMTIwIDE3MCAxMjAgMTcwIDEyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+Cg==';

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.createForm();
  }

  /**
   * On init
   */
  ngOnInit(): void {
    this.initializeForm();

    // If blog data exists on init, populate the form
    if (this.blog) {
      this.populateForm();
    }
  }

  /**
   * On changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['blog']) {
      if (this.blog) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }

    if (changes['isEditMode']) {
      if (!this.isEditMode) {
        this.resetForm();
      }
    }

    // Clear selected image if upload was successful (featured_image was updated)
    if (changes['blog'] && changes['blog'].previousValue && changes['blog'].currentValue) {
      const prevImage = changes['blog'].previousValue?.post?.featured_image;
      const currentImage = changes['blog'].currentValue?.post?.featured_image;
      
      if (!prevImage && currentImage) {
        // Image was just uploaded, clear the selected image
        this.selectedImage = null;
        this.featuredImagePreview = null;
      }
    }
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
      title: ['', Validators.required],
      slug: ['', Validators.required],
      excerpt: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  /**
   * Initialize form
   */
  private initializeForm(): void {
    // Auto-generate slug when title changes
    this.editForm.get('title')?.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(title => {
        if (title && !this.isEditMode) {
          const slug = this.generateSlug(title);
          this.editForm.get('slug')?.setValue(slug);
        }
      });
  }

  /**
   * Populate form with blog data
   */
  private populateForm(): void {
    if (this.blog) {
      this.editForm.patchValue({
        title: this.blog.post.title || '',
        slug: this.blog.post.slug || '',
        excerpt: this.blog.post.excerpt || '',
        content: this.blog.post.content || ''
      });

      // Set featured image preview if exists
      if (this.blog.post.featured_image) {
        this.featuredImagePreview = this.getImageUrl(this.blog.post.featured_image.filename);
      } else {
        this.featuredImagePreview = null;
      }
    }
  }

  /**
   * Reset form to empty state
   */
  private resetForm(): void {
    this.editForm.reset({
      title: '',
      slug: '',
      excerpt: '',
      content: ''
    });

    // Clear image data
    this.selectedImage = null;
    this.featuredImagePreview = null;
  }

  /**
   * Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get image URL
   */
  getImageUrl(filename: string): string {
    if (!filename) return '';

    // Use environment base URL for consistency
    return `${environment.BASE_URL}/images/${filename}`;
  }

  /**
   * On form submit
   */
  onSubmit(): void {
    if (this.editForm.valid) {
      const formData = this.editForm.value;

      if (this.isEditMode) {
        this.update.emit(formData);
      } else {
        this.save.emit(formData);
      }
    }
  }

  /**
   * On delete
   */
  onDelete(): void {
    if (this.blog) {
      this.delete.emit(this.blog.post.id);
    }
  }

  /**
   * On image selected
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImage = input.files[0];

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.featuredImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  /**
   * Upload selected image
   */
  onUploadImage(): void {
    if (this.selectedImage) {
      const blogId = this.blog?.post?.id || 0;
      this.uploadImage.emit({file: this.selectedImage, id: blogId});
    }
  }

  /**
   * Remove featured image
   */
  onRemoveImage(): void {
    if (this.blog?.post.featured_image) {
      const dialogRef = this.dialog.open(DeleteImageDialogComponent, {
        width: '400px',
        data: { imageId: this.blog.post.featured_image.id }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteImage.emit(this.blog!.post.featured_image!.id);
        }
      });
    }
  }

  /**
   * Clear selected image
   */
  clearSelectedImage(): void {
    this.selectedImage = null;
    this.featuredImagePreview = null;
  }

    /**
     * Clear error
     */
    clearError(): void {
        this.error = null;
    }

    /**
     * Get current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }
}
