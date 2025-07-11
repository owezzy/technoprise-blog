import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogPresenter, BlogState } from './blog.presenter';
import { BlogViewComponent } from './blog-view.component';
import { Observable } from 'rxjs';

@Component({
    selector: 'blog-container',
    standalone: true,
    imports: [BlogViewComponent, CommonModule],
    template: `
        <blog-view 
            [state]="state$ | async"
            [pageSizeOptions]="presenter.pageSizeOptions"
            [showPaginator]="presenter.showPaginator"
            [currentPageIndex]="presenter.currentPageIndex"
            [gridClasses]="presenter.getGridClasses()"
            [getImageUrl]="presenter.getImageUrl.bind(presenter)"
            [formatDate]="presenter.formatDate.bind(presenter)"
            [calculateReadingTime]="presenter.calculateReadingTime.bind(presenter)"
            (pageChange)="onPageChange($event)"
            (clearError)="presenter.clearError()">
        </blog-view>
    `,
    providers: [BlogPresenter]
})
export class BlogContainerComponent implements OnInit, OnDestroy {
    state$: Observable<BlogState>;

    constructor(public presenter: BlogPresenter) {
        this.state$ = this.presenter.state$;
    }

    ngOnInit(): void {
        this.presenter.initialize();
    }

    ngOnDestroy(): void {
        this.presenter.destroy();
    }

    onPageChange(event: { pageIndex: number; pageSize: number }): void {
        this.presenter.onPageChange(event.pageIndex, event.pageSize);
    }
}