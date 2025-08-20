import { createContext, useReducer, useContext } from "react";

export const Store = createContext();

const initialState = {
  userInfo: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : { isLogin: false, userId: '', name: '', phone: '', email: '' },
  totalPrice: 0,
  status: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_PRICE':
      return { ...state, totalPrice: action.payload };
    case 'USER_LOGIN':
      const userInfo = {
        isLogin: true,
        userId: action.payload.userId || state.userInfo.userId,
        name: action.payload.name || state.userInfo.name,
        email: action.payload.email || state.userInfo.email,
        phone: action.payload.phone || state.userInfo.phone,
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      return { ...state, userInfo };
    case 'SET_USER_ID':
      const updatedUserInfo = { ...state.userInfo, userId: action.payload };
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      return { ...state, userInfo: updatedUserInfo };
    case 'SET_NAME':
      const updatedNameInfo = { ...state.userInfo, name: action.payload };
      localStorage.setItem("userInfo", JSON.stringify(updatedNameInfo));
      return { ...state, userInfo: updatedNameInfo };
    case 'SET_PHONE':
      const updatedPhoneInfo = { ...state.userInfo, phone: action.payload };
      localStorage.setItem("userInfo", JSON.stringify(updatedPhoneInfo));
      return { ...state, userInfo: updatedPhoneInfo };
    case 'SET_EMAIL':
      const updatedEmailInfo = { ...state.userInfo, email: action.payload };
      localStorage.setItem("userInfo", JSON.stringify(updatedEmailInfo));
      return { ...state, userInfo: updatedEmailInfo };
    case 'SET_REPORT_STATUS':
      return { ...state, status: !state.status };
    case 'LOGOUT':
      localStorage.removeItem("userInfo");
      return { ...state, userInfo: { isLogin: false, userId: '', name: '', phone: '', email: '' } };
    default:
      return state;
  }
};

export function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log("StoreProvider rendering with state:", state); // Add this line
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
