import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { BlogEditPageActions } from '../actions/blog-edit-page.actions';
import { BlogEditApiActions } from '../actions/blog-edit-api.actions';
import { BlogSearchService } from '../blog-search.service';
import * as fromBlog from '../reducers';

@Injectable()
export class BlogEditEffects {
  loadBlog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditPageActions.loadBlog),
      switchMap(({ id }) =>
        this.blogSearchService.getBlogById(id).pipe(
          map((blog) => BlogEditApiActions.loadBlogSuccess({ blog })),
          catchError((error) =>
            of(BlogEditApiActions.loadBlogFailure({ error: error.message }))
          )
        )
      )
    )
  );

  saveBlog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditPageActions.saveBlog),
      switchMap(({ blog }) =>
        this.blogSearchService.createBlog(blog).pipe(
          map((savedBlog) => BlogEditApiActions.saveBlogSuccess({ blog: savedBlog })),
          catchError((error) =>
            of(BlogEditApiActions.saveBlogFailure({ error: error.message }))
          )
        )
      )
    )
  );

  updateBlog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditPageActions.updateBlog),
      switchMap(({ id, blog }) =>
        this.blogSearchService.updateBlog(id, blog).pipe(
          map((updatedBlog) => BlogEditApiActions.updateBlogSuccess({ blog: updatedBlog })),
          catchError((error) =>
            of(BlogEditApiActions.updateBlogFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Reload blog after successful update
  reloadAfterUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditApiActions.updateBlogSuccess),
      map(({ blog }) => BlogEditPageActions.loadBlog({ id: blog.id }))
    )
  );

  // Navigate to edit mode after successful save
  navigateAfterSave$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditApiActions.saveBlogSuccess),
      tap(({ blog }) => {
        this.router.navigate(['/blog/edit', blog.id]);
      })
    ), { dispatch: false }
  );

  deleteBlog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditPageActions.deleteBlog),
      switchMap(({ id }) =>
        this.blogSearchService.deleteBlog(id).pipe(
          map(() => BlogEditApiActions.deleteBlogSuccess({ id })),
          catchError((error) =>
            of(BlogEditApiActions.deleteBlogFailure({ error: error.message }))
          )
        )
      )
    )
  );

  uploadImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditPageActions.uploadImage),
      switchMap(({ file, id }) =>
        this.blogSearchService.uploadImage(file, id).pipe(
          map((response) => BlogEditApiActions.uploadImageSuccess({ image: response.image })),
          catchError((error) =>
            of(BlogEditApiActions.uploadImageFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Reload blog after successful image upload
  reloadAfterImageUpload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditApiActions.uploadImageSuccess),
      withLatestFrom(this.store.select(fromBlog.selectBlogEditBlog)),
      map(([action, blog]) => {
        if (blog?.id) {
          return BlogEditPageActions.loadBlog({ id: blog.id });
        }
        return { type: 'NO_ACTION' };
      })
    )
  );

  deleteImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditPageActions.deleteImage),
      switchMap(({ imageId }) =>
        this.blogSearchService.deleteImage(imageId).pipe(
          map(() => BlogEditApiActions.deleteImageSuccess({ imageId })),
          catchError((error) =>
            of(BlogEditApiActions.deleteImageFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Reload blog after successful image deletion
  reloadAfterImageDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogEditApiActions.deleteImageSuccess),
      withLatestFrom(this.store.select(fromBlog.selectBlogEditBlog)),
      map(([action, blog]) => {
        if (blog?.id) {
          return BlogEditPageActions.loadBlog({ id: blog.id });
        }
        return { type: 'NO_ACTION' };
      })
    )
  );

  constructor(
    private actions$: Actions,
    private blogSearchService: BlogSearchService,
    private router: Router,
    private store: Store
  ) {}
}
