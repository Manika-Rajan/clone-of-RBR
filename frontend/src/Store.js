import React, { createContext, useReducer, useContext } from 'react';

const initialState = {
  isLogin: false,
  userId: '',
  name: '',
  email: '',
  phone: '',
  loginState: { number: '', otpInput: '', name: '', email: '', responseMessage: '', error: '', otpSent: false, isLoading: false },
  loginPhase: 0,
};

export const Store = createContext(initialState);

const reducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOGIN':
      return { ...state, ...action.payload, loginPhase: 2 };
    case 'SET_PHONE':
      return { ...state, phone: action.payload };
    case 'UPDATE_LOGIN_FIELD':
      return { ...state, loginState: { ...state.loginState, [action.field]: action.value } };
    case 'SET_LOGIN_STATE':
      return { ...state, loginState: { ...state.loginState, ...action.payload } };
    default:
      return state;
  }
};

export const StoreProvider = (props) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  console.log('StoreProvider rendering with state:', state);
  return <Store.Provider value={value}>{props.children}</Store.Provider>;
};

export const useStore = () => useContext(Store);
export default StoreProvider;
