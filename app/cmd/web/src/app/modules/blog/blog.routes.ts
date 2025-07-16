import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { BlogContainerComponent } from './containers/blog.container';
import { BlogEditContainerComponent } from './containers/blog-edit.container';
import { BlogDetailContainerComponent } from './containers/blog-detail.container';
import * as fromBlog from './reducers';
import { BlogEffects, CollectionEffects, BlogDetailEffects, BlogEditEffects } from './effects';


export default [
    {
        path     : '',
        component: BlogContainerComponent,
        providers: [
            provideState(fromBlog.blogsFeatureKey, fromBlog.reducers),
            provideEffects([BlogEffects, CollectionEffects, BlogDetailEffects, BlogEditEffects])
        ],
    },
    {
        path     : 'new',
        component: BlogEditContainerComponent,
        providers: [
            provideState(fromBlog.blogsFeatureKey, fromBlog.reducers),
            provideEffects([BlogEffects, CollectionEffects, BlogDetailEffects, BlogEditEffects])
        ],
    },
    {
        path     : 'edit/:id',
        component: BlogEditContainerComponent,
        providers: [
            provideState(fromBlog.blogsFeatureKey, fromBlog.reducers),
            provideEffects([BlogEffects, CollectionEffects, BlogDetailEffects, BlogEditEffects])
        ],
    },
    {
        path     : ':slug',
        component: BlogDetailContainerComponent,
        providers: [
            provideState(fromBlog.blogsFeatureKey, fromBlog.reducers),
            provideEffects([BlogEffects, CollectionEffects, BlogDetailEffects, BlogEditEffects])
        ],
    },
] as Routes;
