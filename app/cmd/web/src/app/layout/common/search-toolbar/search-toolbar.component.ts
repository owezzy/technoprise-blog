import {Component, OnInit, OnDestroy, ViewEncapsulation, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { Store } from '@ngrx/store';
import { FindBlogPageActions } from 'app/modules/blog/actions/find-blog-page.actions';
import * as fromBlog from 'app/modules/blog/reducers';

@Component({
    selector: 'search-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        ReactiveFormsModule,
        RouterLink
    ],
    templateUrl: './search-toolbar.component.html',
    styleUrls: ['./search-toolbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SearchToolbarComponent implements OnInit, OnDestroy {
    @Input() query = '';
    @Input() searching = false;
    @Input() error = '';
    searchControl = new FormControl('');
    isSearchActive = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(private store: Store) {}

    ngOnInit(): void {
        // Subscribe to blog search query from NgRx store
        this.store.select(fromBlog.selectSearchQuery)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(query => {
                this.isSearchActive = query.length > 0;
                
                // Update form control if query changed from external source
                if (query !== this.searchControl.value) {
                    this.searchControl.setValue(query, { emitEvent: false });
                }

                // Clear search control when search becomes inactive
                if (!this.isSearchActive && this.searchControl.value) {
                    this.searchControl.setValue('', { emitEvent: false });
                }
            });

        // Subscribe to search control changes and dispatch NgRx actions
        this.searchControl.valueChanges
            .pipe(
                distinctUntilChanged(),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(value => {
                // Always dispatch the search action, let NgRx handle the logic
                this.store.dispatch(FindBlogPageActions.searchBlogs({ 
                    query: value || '', 
                    page: 1, 
                    pageSize: 9, 
                    updateUrl: true 
                }));
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        // Dispatch action to clear search in NgRx store
        this.store.dispatch(FindBlogPageActions.searchBlogs({ 
            query: '', 
            page: 1, 
            pageSize: 9, 
            updateUrl: true 
        }));
    }

    get placeholder(): string {
        return this.isSearchActive ? 'Search blog posts...' : 'Search...';
    }

}
