import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';


import * as fromBlog from './reducers';
import { BlogContainerComponent } from './containers/blog.container';
import { BlogDetailContainerComponent } from './containers/blog-detail.container';
import { BlogEditContainerComponent } from './containers/blog-edit.container';
import {BlogDetailEffects, BlogEditEffects, BlogEffects, CollectionEffects} from "./effects";
import {BlogPreviewComponent, BlogPreviewListComponent} from "./components/blog-preview-list.component";



export const COMPONENTS = [
    BlogPreviewComponent,
    BlogPreviewListComponent,
];

export const CONTAINERS = [
  BlogContainerComponent,
  BlogDetailContainerComponent,
  BlogEditContainerComponent,
];

@NgModule({
  imports: [
    CommonModule,

    /**
     * StoreModule.forFeature is used for composing state
     * from feature modules. These modules can be loaded
     * eagerly or lazily and will be dynamically added to
     * the existing state.
     */
    StoreModule.forFeature(fromBlog.blogsFeatureKey, fromBlog.reducers),

    /**
     * Effects.forFeature is used to register effects
     * from feature modules. Effects can be loaded
     * eagerly or lazily and will be started immediately.
     *
     * All Effects will only be instantiated once regardless of
     * whether they are registered once or multiple times.
     */
    EffectsModule.forFeature([BlogEffects, CollectionEffects, BlogDetailEffects, BlogEditEffects]),
  ],
  declarations: [COMPONENTS, CONTAINERS],
})
export class BlogModule {}
