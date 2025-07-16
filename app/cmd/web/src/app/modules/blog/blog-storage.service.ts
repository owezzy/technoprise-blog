import { Inject, Injectable, InjectionToken } from '@angular/core';

import { Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BlogPost, BlogResponse } from './models';


export function storageFactory() {
  return typeof window === 'undefined' || typeof localStorage === 'undefined'
    ? null
    : localStorage;
}

export const LOCAL_STORAGE_TOKEN = new InjectionToken(
  'blogs-local-storage',
  { factory: storageFactory }
);

@Injectable({ providedIn: 'root' })
export class BlogStorageService {
  private collectionKey = 'blogs-app';

  supported(): Observable<boolean> {
    return this.storage !== null
      ? of(true)
      : throwError(() => 'Local Storage Not Supported');
  }

  getCollection(): Observable<any> {
    return this.supported().pipe(
      map((_) => this.storage.getItem(this.collectionKey)),
      map((value: string | null) => (value ? JSON.parse(value) : []))
    );
  }

  addToCollection(records: BlogPost): Observable<BlogResponse> {
    return this.getCollection().pipe(
      map((value: BlogResponse) => ({...value, posts: [...value.posts, records]})),
      tap((value: BlogResponse) =>
        this.storage.setItem(this.collectionKey, JSON.stringify(value.posts))
      )
    );
  }

  removeFromCollection(ids: Array<string>): Observable<any> {
    return this.getCollection().pipe(
      map((value: BlogResponse) => value.posts.filter((item) => !ids.includes(String(item.id)))),
      tap((value ) =>
        this.storage.setItem(this.collectionKey, JSON.stringify(value))
      )
    );
  }

  deleteCollection(): Observable<boolean> {
    return this.supported().pipe(
      tap(() => this.storage.removeItem(this.collectionKey))
    );
  }

  constructor(@Inject(LOCAL_STORAGE_TOKEN) private storage: Storage) {}
}
