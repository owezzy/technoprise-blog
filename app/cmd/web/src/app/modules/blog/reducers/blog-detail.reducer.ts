import { createReducer, on } from '@ngrx/store';
import { BlogPost } from '../models';
import { BlogDetailPageActions } from '../actions/blog-detail-page.actions';
import { BlogDetailApiActions } from '../actions/blog-detail-api.actions';

export const blogDetailFeatureKey = 'blogDetail';

export interface State {
  blog: BlogPost | null;
  loading: boolean;
  error: string | null;
}

const initialState: State = {
  blog: null,
  loading: false,
  error: null,
};

export const reducer = createReducer(
  initialState,
  on(BlogDetailPageActions.loadBlog, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BlogDetailApiActions.loadBlogSuccess, (state, { blog }) => ({
    ...state,
    blog,
    loading: false,
    error: null,
  })),
  on(BlogDetailApiActions.loadBlogFailure, (state, { error }) => ({
    ...state,
    blog: null,
    loading: false,
    error,
  })),
  on(BlogDetailPageActions.leavePage, () => initialState)
);

export const getBlog = (state: State) => state.blog;
export const getLoading = (state: State) => state.loading;
export const getError = (state: State) => state.error;