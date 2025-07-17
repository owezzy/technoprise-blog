import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil, combineLatest, filter, pairwise } from 'rxjs';
import { BlogEditComponent } from '../components/edit/blog-edit.component';
import { BlogPost } from '../models';
import * as fromBlog from '../reducers';
import { BlogEditPageActions } from '../actions/blog-edit-page.actions';
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseLoadingService } from '@fuse/services/loading';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'blog-edit-container',
  standalone: true,
  imports: [BlogEditComponent, CommonModule, FuseAlertComponent, MatIconModule],
  template: `
    <!-- Success Alert -->
    <fuse-alert
      *ngIf="showSuccessAlert"
      [appearance]="'soft'"
      [type]="'success'"
      [dismissible]="true"
      [showIcon]="true"
      (dismissedChanged)="onSuccessAlertDismissed()"
      class="fixed bottom-4 right-4 z-50 max-w-sm">
      <span>{{ successMessage }}</span>
    </fuse-alert>

    <!-- Error Alert -->
    <fuse-alert
      *ngIf="error$ | async as error"
      [appearance]="'soft'"
      [type]="'error'"
      [dismissible]="true"
      [showIcon]="true"
      (dismissedChanged)="onErrorAlertDismissed()"
      class="fixed bottom-4 right-4 z-50 max-w-sm">
      <span>{{ error }}</span>
    </fuse-alert>

    <!-- Image Upload Error Alert -->
    <fuse-alert
      *ngIf="imageUploadError$ | async as imageError"
      [appearance]="'soft'"
      [type]="'error'"
      [dismissible]="true"
      [showIcon]="true"
      (dismissedChanged)="onImageErrorAlertDismissed()"
      class="fixed bottom-4 right-4 z-50 max-w-sm">
      <span>Image upload failed: {{ imageError }}</span>
    </fuse-alert>

    <blog-edit
      [blog]="blog$ | async"
      [loading]="loading$ | async"
      [saving]="saving$ | async"
      [error]="error$ | async"
      [uploadingImage]="uploadingImage$ | async"
      [deletingImage]="deletingImage$ | async"
      [imageUploadError]="imageUploadError$ | async"
      [isEditMode]="isEditMode"
      (save)="onSave($event)"
      (update)="onUpdate($event)"
      (delete)="onDelete($event)"
      (uploadImage)="onUploadImage($event)"
      (deleteImage)="onDeleteImage($event)">
    </blog-edit>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogEditContainerComponent implements OnInit, OnDestroy {
  blog$: Observable<BlogPost | null>;
  loading$: Observable<boolean>;
  saving$: Observable<boolean>;
  error$: Observable<string | null>;
  uploadingImage$: Observable<boolean>;
  deletingImage$: Observable<boolean>;
  imageUploadError$: Observable<string | null>;
  isEditMode: boolean = false;

  // Success alert state
  showSuccessAlert: boolean = false;
  successMessage: string = '';

  private destroy$ = new Subject<void>();
  private _fuseLoadingService = inject(FuseLoadingService);

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.blog$ = this.store.select(fromBlog.selectBlogEditBlog);
    this.loading$ = this.store.select(fromBlog.selectBlogEditLoading);
    this.saving$ = this.store.select(fromBlog.selectBlogEditSaving);
    this.error$ = this.store.select(fromBlog.selectBlogEditError);
    this.uploadingImage$ = this.store.select(fromBlog.selectBlogEditUploadingImage);
    this.deletingImage$ = this.store.select(fromBlog.selectBlogEditDeletingImage);
    this.imageUploadError$ = this.store.select(fromBlog.selectBlogEditImageUploadError);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.store.dispatch(BlogEditPageActions.loadBlog({ id: +id }));
    } else {
      this.isEditMode = false;
      this.store.dispatch(BlogEditPageActions.createNewBlog());
    }

    // Subscribe to all loading states and control FuseLoadingBar
    combineLatest([
      this.loading$,
      this.saving$,
      this.uploadingImage$,
      this.deletingImage$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([loading, saving, uploadingImage, deletingImage]) => {
      const isLoading = loading || saving || uploadingImage || deletingImage;
      if (isLoading) {
        this._fuseLoadingService.show();
      } else {
        this._fuseLoadingService.hide();
      }
    });

    // Listen to saving and error state changes for success notifications
    combineLatest([
      this.saving$.pipe(pairwise()),
      this.error$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([[previousSaving, currentSaving], error]) => {
      // Show success when saving changes from true to false and there's no error
      if (previousSaving === true && currentSaving === false && !error) {
        this.successMessage = this.isEditMode ? 'Blog post updated successfully!' : 'Blog post created successfully!';
        this.showSuccessAlert = true;

        // Auto-dismiss after 7 seconds
        setTimeout(() => {
          this.showSuccessAlert = false;
        }, 7000);
      }
    });
  }

  ngOnDestroy(): void {
    // Ensure loading bar is hidden when component is destroyed
    this._fuseLoadingService.hide();
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(BlogEditPageActions.leavePage());
  }

  onSave(blog: Partial<BlogPost>): void {
    this.store.dispatch(BlogEditPageActions.saveBlog({ blog }));
  }

  onUpdate(blog: Partial<BlogPost>): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.store.dispatch(BlogEditPageActions.updateBlog({ id: +id, blog }));
    }
  }

  onDelete(id: number): void {
    this.store.dispatch(BlogEditPageActions.deleteBlog({ id }));
  }

  onUploadImage(data: { file: File; id: number }): void {
    // For new posts, we might not have an ID yet, so use the route parameter if available
    const blogId = data.id || (this.isEditMode ? +this.route.snapshot.params['id'] : 0);
    this.store.dispatch(BlogEditPageActions.uploadImage({ file: data.file, id: blogId }));
  }

  onDeleteImage(imageId: number): void {
    this.store.dispatch(BlogEditPageActions.deleteImage({ imageId }));
  }

  // Alert dismissal methods
  onSuccessAlertDismissed(): void {
    this.showSuccessAlert = false;
  }

  onErrorAlertDismissed(): void {
    // Clear the error from the store
    // You might need to dispatch an action to clear the error state
    // For now, we'll just dismiss the alert
  }

  onImageErrorAlertDismissed(): void {
    // Clear the image upload error from the store
    // You might need to dispatch an action to clear the error state
    // For now, we'll just dismiss the alert
  }
}
