import { BlogsApiActions } from '../actions/blogs-api.actions';
import { FindBlogPageActions } from '../actions/find-blog-page.actions';
import { createReducer, on } from '@ngrx/store';

export const searchFeatureKey = 'search';

export interface State {
  ids: string[];
  loading: boolean;
  error: string;
  query: string;
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const initialState: State = {
  ids: [],
  loading: false,
  error: '',
  query: '',
  totalRecords: 0,
  currentPage: 1,
  pageSize: 9,
  totalPages: 0,
};

export const reducer = createReducer(
  initialState,
  on(FindBlogPageActions.searchBlogs, FindBlogPageActions.loadFromURL, (state, { query, page, pageSize }) => {
    // Handle empty query like books pattern
    return query === ''
      ? {
          ...state,
          loading: true,
          error: '',
          query,
          currentPage: page || 1,
          pageSize: pageSize || state.pageSize,
        }
      : {
          ...state,
          loading: true,
          error: '',
          query,
          currentPage: page || 1,
          pageSize: pageSize || state.pageSize,
        };
  }),
  on(FindBlogPageActions.changePage, (state, { page, pageSize }) => ({
    ...state,
    loading: true,
    error: '',
    currentPage: page,
    pageSize: pageSize,
  })),
  on(BlogsApiActions.searchSuccess, (state, { blogs }) => ({
    ...state,
    ids: blogs.posts.map((blog) => blog.id.toString()),
    loading: false,
    error: '',
    totalRecords: blogs.metadata?.total_records || 0,
    currentPage: blogs.metadata?.current_page || state.currentPage,
    pageSize: blogs.metadata?.page_size || state.pageSize,
    totalPages: blogs.metadata?.last_page || 0,
  })),
  on(BlogsApiActions.searchFailure, (state, { errorMsg }) => ({
    ...state,
    loading: false,
    error: errorMsg,
  })),
  on(FindBlogPageActions.clearError, (state) => ({
    ...state,
    error: '',
  }))
);

export const getIds = (state: State) => state.ids;

export const getQuery = (state: State) => state.query;

export const getLoading = (state: State) => state.loading;

export const getError = (state: State) => state.error;

export const getTotalRecords = (state: State) => state.totalRecords;

export const getCurrentPage = (state: State) => state.currentPage;

export const getPageSize = (state: State) => state.pageSize;

export const getTotalPages = (state: State) => state.totalPages;
