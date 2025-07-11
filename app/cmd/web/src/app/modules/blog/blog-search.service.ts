import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlogSearchService {
  private _searchQuery = new BehaviorSubject<string>('');
  private _isSearchActive = new BehaviorSubject<boolean>(false);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for search query
   */
  get searchQuery$(): Observable<string> {
    return this._searchQuery.asObservable();
  }

  /**
   * Getter for search active state
   */
  get isSearchActive$(): Observable<boolean> {
    return this._isSearchActive.asObservable();
  }

  /**
   * Get current search query
   */
  get currentSearchQuery(): string {
    return this._searchQuery.value;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this._searchQuery.next(query);
    this._isSearchActive.next(query.trim().length > 0);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this._searchQuery.next('');
    this._isSearchActive.next(false);
  }

  /**
   * Set search active state
   */
  setSearchActive(active: boolean): void {
    this._isSearchActive.next(active);
  }
}