import { Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { defer, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { CollectionPageActions } from '../actions/collection-page.actions';
import { BlogResponse } from '../models';
import { CollectionApiActions } from '../actions/collection-api.actions';
import { SelectedBlogPageActions } from '../actions/selected-blog-page.actions';
import { BlogStorageService } from '../blog-storage.service';


@Injectable()
export class CollectionEffects {
  /**
   * This effect does not yield any actions back to the store. Set
   * `dispatch` to false to hint to @ngrx/effects that it should
   * ignore any elements of this effect stream.
   *
   * The `defer` observable accepts an observable factory function
   * that is called when the observable is subscribed to.
   * Wrapping the supported call in `defer` makes
   * effect easier to test.
   */
  checkStorageSupport$ = createEffect(
    () => defer(() => this.storageService.supported()),
    { dispatch: false }
  );

  loadCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionPageActions.enter),
      switchMap(() =>
        this.storageService.getCollection().pipe(
          map((blogs: BlogResponse) =>
            CollectionApiActions.loadBlogsSuccess({ blogs })
          ),
          catchError((error) =>
            of(CollectionApiActions.loadBlogsFailure({ error }))
          )
        )
      )
    )
  );

  addBlogToCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SelectedBlogPageActions.addBlog),
      mergeMap(({ blog }) =>
        this.storageService.addToCollection(blog).pipe(
          map(() => CollectionApiActions.addBlogSuccess({ blog })),
          catchError(() => of(CollectionApiActions.addBlogFailure({ blog })))
        )
      )
    )
  );

  removeBlogFromCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SelectedBlogPageActions.removeBlog),
      mergeMap(({ blog }) =>
        this.storageService.removeFromCollection([String(blog.id)]).pipe(
          map(() => CollectionApiActions.removeBlogSuccess({ blog })),
          catchError(() => of(CollectionApiActions.removeBlogFailure({ blog })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private storageService: BlogStorageService
  ) {}
}
