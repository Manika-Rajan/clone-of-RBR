import { createContext, useReducer } from "react";

export const Store = createContext();

const initialState = {
  isLogin: localStorage.getItem("isLogin") === "true" || false,
  userId: localStorage.getItem("userId") || '', // Added userId
  name: '',
  phone: '',
  email: '',
  totalPrice: 0,
  status: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_PRICE':
      return { ...state, totalPrice: action.payload };
    case 'USER_LOGIN':
      localStorage.setItem("isLogin", action.payload.isLogin);
      if (action.payload.userId) localStorage.setItem("userId", action.payload.userId); // Persist userId
      return { ...state, isLogin: action.payload.isLogin, userId: action.payload.userId || state.userId };
    case 'SET_USER_ID': // Added
      localStorage.setItem("userId", action.payload);
      return { ...state, userId: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_PHONE':
      return { ...state, phone: action.payload };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_REPORT_STATUS':
      return { ...state, status: !state.status };
    case 'LOGOUT':
      localStorage.setItem("isLogin", "false");
      localStorage.removeItem("userId"); // Clear userId on logout
      return { ...state, isLogin: false, userId: '', name: '', phone: '', email: '' };
    default:
      return state;
  }
};

export function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children}</Store.Provider>;
}
