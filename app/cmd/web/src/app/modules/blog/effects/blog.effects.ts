import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { asyncScheduler, EMPTY as empty, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  map,
  skip,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { FindBlogPageActions } from '../actions/find-blog-page.actions';
import { BlogsApiActions } from '../actions/blogs-api.actions';
import { BlogEditApiActions } from '../actions/blog-edit-api.actions';
import { BlogSearchService } from '../blog-search.service';
import * as fromBlog from '../reducers';


/**
 * Effects offer a way to isolate and easily test side-effects within your
 * application.
 *
 * If you are unfamiliar with the operators being used in these examples, please
 * check out the sources below:
 *
 * Official Docs: http://reactivex.io/rxjs/manual/overview.html#categories-of-operators
 * RxJS 5 Operators By Example: https://gist.github.com/btroncone/d6cf141d6f2c00dc6b35
 */

@Injectable()
export class BlogEffects {
  search$ = createEffect(
    () =>
      ({ debounce = 300, scheduler = asyncScheduler } = {}) =>
        this.actions$.pipe(
          ofType(FindBlogPageActions.searchBlogs, FindBlogPageActions.loadFromURL),
          debounceTime(debounce, scheduler),
          switchMap(({ query, page = 1, pageSize = 9 }) => {
            // Handle empty query like books pattern
            if (query === '') {
              // For empty query, load first page of all blogs
              const params = new URLSearchParams();
              params.set('page', page.toString());
              params.set('page_size', pageSize.toString());
              
              const nextSearch$ = this.actions$.pipe(
                ofType(FindBlogPageActions.searchBlogs, FindBlogPageActions.loadFromURL),
                skip(1)
              );

              return this.blogSearchService.getBlogs(params.toString()).pipe(
                takeUntil(nextSearch$),
                map((response) => BlogsApiActions.searchSuccess({ blogs: response })),
                catchError((err) =>
                  of(BlogsApiActions.searchFailure({ errorMsg: err.message }))
                )
              );
            }

            // Handle search query
            const params = new URLSearchParams();
            params.set('title', query.trim());
            params.set('page', page.toString());
            params.set('page_size', pageSize.toString());

            const nextSearch$ = this.actions$.pipe(
              ofType(FindBlogPageActions.searchBlogs, FindBlogPageActions.loadFromURL),
              skip(1)
            );

            return this.blogSearchService.getBlogs(params.toString()).pipe(
              takeUntil(nextSearch$),
              map((response) => BlogsApiActions.searchSuccess({ blogs: response })),
              catchError((err) =>
                of(BlogsApiActions.searchFailure({ errorMsg: err.message }))
              )
            );
          })
        )
  );

  changePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FindBlogPageActions.changePage),
      switchMap(({ page, pageSize }) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('page_size', pageSize.toString());

        return this.blogSearchService.getBlogs(params.toString()).pipe(
          map((response) => BlogsApiActions.searchSuccess({ blogs: response })),
          catchError((err) =>
            of(BlogsApiActions.searchFailure({ errorMsg: err.message }))
          )
        );
      })
    )
  );

  updateUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FindBlogPageActions.searchBlogs, FindBlogPageActions.changePage),
      switchMap(({ query, page, pageSize, updateUrl }) => {
        if (updateUrl !== false) {
          const queryParams: any = {};
          if (query) queryParams.q = query;
          if (page && page > 1) queryParams.page = page.toString();
          if (pageSize && pageSize !== 9) queryParams.pageSize = pageSize.toString();

          this.router.navigate([], {
            queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        }
        return empty;
      })
    ),
    { dispatch: false }
  );

  // Refresh blog list after create/update/delete operations
  refreshListAfterBlogOperations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        BlogEditApiActions.saveBlogSuccess,
        BlogEditApiActions.updateBlogSuccess,
        BlogEditApiActions.deleteBlogSuccess
      ),
      switchMap(() => {
        // Trigger a refresh with current search query and reset to page 1
        return this.store.select(fromBlog.selectSearchQuery).pipe(
          take(1),
          switchMap((currentQuery) => {
            const params = new URLSearchParams();
            if (currentQuery && currentQuery.trim()) {
              params.set('title', currentQuery.trim());
            }
            params.set('page', '1');
            params.set('page_size', '9');
            
            return this.blogSearchService.getBlogs(params.toString()).pipe(
              map((response) => BlogsApiActions.searchSuccess({ blogs: response })),
              catchError((err) =>
                of(BlogsApiActions.searchFailure({ errorMsg: err.message }))
              )
            );
          })
        );
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
