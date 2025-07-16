import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { BlogDetailPageActions } from '../actions/blog-detail-page.actions';
import { BlogDetailApiActions } from '../actions/blog-detail-api.actions';
import { BlogSearchService } from '../blog-search.service';

@Injectable()
export class BlogDetailEffects {
  loadBlog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogDetailPageActions.loadBlog),
      switchMap(({ slug }) =>
        this.blogSearchService.getBlogBySlug(slug).pipe(
          map((blog) => BlogDetailApiActions.loadBlogSuccess({ blog })),
          catchError((error) =>
            of(BlogDetailApiActions.loadBlogFailure({ error: error.message }))
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private blogSearchService: BlogSearchService
  ) {}
}