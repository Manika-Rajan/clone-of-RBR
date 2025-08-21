import React, { createContext, useReducer, useContext } from 'react';

// Initial State
const initialState = {
  userInfo: JSON.parse(localStorage.getItem('userInfo')) || { isLogin: false },
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOGIN':
      const newUserInfo = { ...state.userInfo, ...action.payload, isLogin: true };
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      console.log("Store reducer - USER_LOGIN updated state:", newUserInfo);
      return { ...state, userInfo: newUserInfo };
    case 'SET_PHONE':
      return { ...state, userInfo: { ...state.userInfo, phone: action.payload } };
    case 'SET_USER_ID':
      return { ...state, userInfo: { ...state.userInfo, userId: action.payload } };
    case 'SET_REPORT_STATUS':
      return { ...state, userInfo: { ...state.userInfo, status: !state.userInfo.status } };
    case 'SET_PHOTO_URL':
      const updatedUserInfo = { ...state.userInfo, photo_url: action.payload };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      console.log("Store reducer - SET_PHOTO_URL updated state:", updatedUserInfo);
      return { ...state, userInfo: updatedUserInfo };
    default:
      return state;
  }
};

// Context
const StoreContext = createContext();

// Provider
export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log("StoreProvider rendering with state:", state);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom Hook
export const useStore = () => useContext(StoreContext);
