import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { BlogDetailComponent } from '../components/details/blog-detail.component';
import { BlogPost } from '../models';
import * as fromBlog from '../reducers';
import { BlogDetailPageActions } from '../actions/blog-detail-page.actions';

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

  constructor(
    private store: Store,
    private route: ActivatedRoute
  ) {
    this.blog$ = this.store.select(fromBlog.selectBlogDetailBlog);
    this.loading$ = this.store.select(fromBlog.selectBlogDetailLoading);
    this.error$ = this.store.select(fromBlog.selectBlogDetailError);
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.params['slug'];
    if (slug) {
      this.store.dispatch(BlogDetailPageActions.loadBlog({ slug }));
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(BlogDetailPageActions.leavePage());
  }
}