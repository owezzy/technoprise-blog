import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { BlogSearchService } from 'app/modules/blog/blog-search.service';

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
    searchControl = new FormControl('');
    isSearchActive = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(private _blogSearchService: BlogSearchService) {}

    ngOnInit(): void {
        // Subscribe to blog search active state
        this._blogSearchService.isSearchActive$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(isActive => {
                this.isSearchActive = isActive;
                
                // Clear search control when search becomes inactive
                if (!isActive && this.searchControl.value) {
                    this.searchControl.setValue('', { emitEvent: false });
                }
            });

        // Subscribe to blog search query changes
        this._blogSearchService.searchQuery$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(query => {
                if (this.isSearchActive && query !== this.searchControl.value) {
                    this.searchControl.setValue(query, { emitEvent: false });
                }
            });

        // Subscribe to search control changes
        this.searchControl.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(value => {
                if (this.isSearchActive) {
                    this._blogSearchService.setSearchQuery(value || '');
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        if (this.isSearchActive) {
            this._blogSearchService.setSearchQuery('');
        }
    }

    get placeholder(): string {
        return this.isSearchActive ? 'Search blog posts...' : 'Search...';
    }
}