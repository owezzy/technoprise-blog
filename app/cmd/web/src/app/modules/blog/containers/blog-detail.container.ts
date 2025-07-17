import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { BlogDetailComponent } from '../components/details/blog-detail.component';
import { BlogPost } from '../models';
import * as fromBlog from '../reducers';
import { BlogDetailPageActions } from '../actions/blog-detail-page.actions';
import { FuseLoadingService } from '@fuse/services/loading';

@Component({
  selector: 'blog-detail-container',
  standalone: true,
  imports: [BlogDetailComponent, CommonModule],
  template: `
    <blog-detail
      [blog]="blog$ | async"
      [loading]="loading$ | async"
      [error]="error$ | async">
    </blog-detail>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailContainerComponent implements OnInit, OnDestroy {
  blog$: Observable<BlogPost | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  private destroy$ = new Subject<void>();
  private _fuseLoadingService = inject(FuseLoadingService);

  constructor(
    private store: Store,
    private route: ActivatedRoute
  ) {
    this.blog$ = this.store.select(fromBlog.selectBlogDetailBlog);
    this.loading$ = this.store.select(fromBlog.selectBlogDetailLoading);
    this.error$ = this.store.select(fromBlog.selectBlogDetailError);
  }

  ngOnInit(): void {
    // Subscribe to loading state and control FuseLoadingBar
    this.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        if (loading) {
          this._fuseLoadingService.show();
        } else {
          this._fuseLoadingService.hide();
        }
      });

    const slug = this.route.snapshot.params['slug'];
    if (slug) {
      this.store.dispatch(BlogDetailPageActions.loadBlog({ slug }));
    }
  }

  ngOnDestroy(): void {
    // Ensure loading bar is hidden when component is destroyed
    this._fuseLoadingService.hide();
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(BlogDetailPageActions.leavePage());
  }
}