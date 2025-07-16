import { createReducer, on } from '@ngrx/store';

import { CollectionApiActions } from '../actions/collection-api.actions';
import { CollectionPageActions } from '../actions/collection-page.actions';
import { SelectedBlogPageActions } from '../actions/selected-blog-page.actions';

export const collectionFeatureKey = 'collection';

export interface State {
  loaded: boolean;
  loading: boolean;
  ids: string[];
}

const initialState: State = {
  loaded: false,
  loading: false,
  ids: [],
};

export const reducer = createReducer(
  initialState,
  on(CollectionPageActions.enter, (state) => ({
    ...state,
    loading: true,
  })),
  on(CollectionApiActions.loadBlogsSuccess, (_state, { blogs }) => ({
    loaded: true,
    loading: false,
    ids: blogs.posts.map((blog) => blog.id.toString()),
  })),
  /**
   * Optimistically add blog to collection.
   * If this succeeds there's nothing to do.
   * If this fails we revert state by removing the blog.
   *
   * `on` supports handling multiple types of actions
   */
  on(
    SelectedBlogPageActions.addBlog,
    CollectionApiActions.removeBlogFailure,
    (state, { blog }) => {
      if (state.ids.indexOf(blog.id.toString()) > -1) {
        return state;
      }
      return {
        ...state,
        ids: [...state.ids, blog.id.toString()],
      };
    }
  ),
  /**
   * Optimistically remove blog from collection.
   * If addBlog fails, we "undo" adding the blog.
   */
  on(
    SelectedBlogPageActions.removeBlog,
    CollectionApiActions.addBlogFailure,
    (state, { blog }) => ({
      ...state,
      ids: state.ids.filter((id) => id !== blog.id.toString()),
    })
  )
);

export const getLoaded = (state: State) => state.loaded;

export const getLoading = (state: State) => state.loading;

export const getIds = (state: State) => state.ids;
