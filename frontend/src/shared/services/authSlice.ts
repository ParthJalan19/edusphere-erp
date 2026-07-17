import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from './apiClient.js';

export interface User {
  _id: string;
  email: string;
  role: 'Teacher' | 'Student';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
  employeeId?: string;
  phone?: string;
  designation?: string;
  joiningDate?: string;
  admissionDate?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  checkingSession: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  profile: null,
  loading: false,
  checkingSession: true,
  error: null,
};

// Async Thunk for Login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: Record<string, string>, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data.data;
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Async Thunk for Logout
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data.data;
  } catch (error) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    return rejectWithValue(err.response?.data?.error?.message || 'Logout failed');
  }
});

// Async Thunk to fetch currently logged in user profile (on reload)
export const checkAuthSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.data;
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      return rejectWithValue(err.response?.data?.error?.message || 'Session verification failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoggedOut: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.profile = null;
      state.checkingSession = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login reducers
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        loginUser.fulfilled,
        (
          state,
          action: PayloadAction<{
            user: User;
            profile: Profile;
            accessToken?: string;
            refreshToken?: string;
          }>
        ) => {
          state.loading = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.profile = action.payload.profile;
          state.error = null;
          if (action.payload.accessToken) {
            localStorage.setItem('accessToken', action.payload.accessToken);
          }
          if (action.payload.refreshToken) {
            localStorage.setItem('refreshToken', action.payload.refreshToken);
          }
        }
      )
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.profile = null;
        state.error = action.payload as string;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      // Logout reducers
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.profile = null;
        state.error = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      // Check session reducers
      .addCase(checkAuthSession.pending, (state) => {
        state.checkingSession = true;
      })
      .addCase(
        checkAuthSession.fulfilled,
        (state, action: PayloadAction<{ user: User; profile: Profile }>) => {
          state.checkingSession = false;
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.profile = action.payload.profile;
          state.error = null;
        }
      )
      .addCase(checkAuthSession.rejected, (state) => {
        state.checkingSession = false;
        state.isAuthenticated = false;
        state.user = null;
        state.profile = null;
      });
  },
});

export const { clearError, setLoggedOut } = authSlice.actions;
export default authSlice.reducer;
