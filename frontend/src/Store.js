import { createContext, useReducer } from 'react';

const initialState = {
  isLogin: false,
  userInfo: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null,
  loginState: {
    number: '',
    otpInput: '',
    otpSent: false,
    updateTrigger: 0,
    isLoading: false,
    error: '',
    responseMessage: '',
  },
  status: false,
  name: '',
  email: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOGIN':
      return { ...state, isLogin: true, userInfo: action.payload, status: false };
    case 'USER_LOGOUT':
      return { ...state, isLogin: false, userInfo: null, loginState: initialState.loginState, status: false };
    case 'UPDATE_LOGIN_FIELD':
      return { ...state, loginState: { ...state.loginState, [action.field]: action.value } };
    case 'SET_LOGIN_STATE':
      return { ...state, loginState: { ...state.loginState, ...action.payload } };
    case 'SET_PHONE':
      return { ...state, loginState: { ...state.loginState, number: action.payload.replace('+91', '') } };
    case 'SET_REPORT_STATUS':
      return { ...state, status: true, name: state.userInfo?.name || '', email: state.userInfo?.email || '' };
    default:
      return state;
  }
};

export const Store = createContext({
  state: initialState,
  dispatch: () => null,
});

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log('Store.js:33 StoreProvider rendering with state:', state);
  return <Store.Provider value={{ state, dispatch }}>{children}</Store.Provider>;
};
