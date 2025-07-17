import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlogPost, BlogResponse, BlogImage } from './models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BlogSearchService {
  private readonly baseUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  // HTTP API methods
  getBlogs(params: string): Observable<BlogResponse> {
    return this.http.get<BlogResponse>(`${this.baseUrl}/posts?${params}`);
  }

  getBlogById(id: number): Observable<BlogPost> {
    return this.http.get<{post: BlogPost}>(`${this.baseUrl}/posts/${id}`).pipe(
      map(response => response.post)
    );
  }

  getBlogBySlug(slug: string): Observable<BlogPost> {
    return this.http.get<{post: BlogPost}>(`${this.baseUrl}/slug/${slug}`).pipe(
      map(response => response.post)
    );
  }

  createBlog(blog: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.post<{post: BlogPost}>(`${this.baseUrl}/posts`, blog).pipe(
      map(response => response.post)
    );
  }

  updateBlog(id: number, blog: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.patch<{post: BlogPost}>(`${this.baseUrl}/posts/${id}`, blog).pipe(
      map(response => response.post)
    );
  }

  deleteBlog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${id}`);
  }

  uploadImage(file: File, id: number): Observable<{ image: BlogImage }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('is_featured', 'true'); // Mark as featured image
    return this.http.post<{ image: BlogImage }>(`${this.baseUrl}/posts/${id}/images`, formData);
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/images/${imageId}`);
  }
}
