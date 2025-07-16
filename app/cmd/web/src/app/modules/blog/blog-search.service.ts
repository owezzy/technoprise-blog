import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { BlogPost, BlogResponse } from './models';
import { environment } from '../../../environments/environment';
import * as fromBlog from './reducers';
import { FindBlogPageActions } from './actions/find-blog-page.actions';

@Injectable({
  providedIn: 'root'
})
export class BlogSearchService {
  private readonly baseUrl = environment.BASE_URL;

  // State management observables from NgRx store
  searchQuery$ = this.store.select(fromBlog.selectSearchQuery);
  isSearchActive$ = this.store.select(fromBlog.selectSearchQuery).pipe(
    map(query => query.length > 0)
  );

  constructor(private http: HttpClient, private store: Store) {}

  // State management methods that dispatch NgRx actions
  setSearchQuery(query: string): void {
    this.store.dispatch(FindBlogPageActions.searchBlogs({ query, page: 1, pageSize: 9, updateUrl: true }));
  }

  // HTTP API methods
  getBlogs(params: string): Observable<BlogResponse> {
    return this.http.get<BlogResponse>(`${this.baseUrl}/posts?${params}`);
  }

  getBlogById(id: number): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.baseUrl}/posts/${id}`);
  }

  getBlogBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.baseUrl}/slug/${slug}`);
  }

  createBlog(blog: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.baseUrl}/posts`, blog);
  }

  updateBlog(id: number, blog: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`${this.baseUrl}/posts/${id}`, blog);
  }

  deleteBlog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${id}`);
  }

  uploadImage(file: File, id: number): Observable<{ image: { id: number; filename: string; file_path: string; alt_text?: string; caption?: string } }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ image: { id: number; filename: string; file_path: string; alt_text?: string; caption?: string } }>(`${this.baseUrl}/posts/${id}/images`, formData);
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/images/${imageId}`);
  }
}
