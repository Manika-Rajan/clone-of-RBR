import { createContext, useReducer, useContext } from "react";

export const Store = createContext();

const initialState = {
  userInfo: {
    isLogin: localStorage.getItem("isLogin") === "true",
    userId: localStorage.getItem("userId") || "",
    name: localStorage.getItem("userName") || "",
    phone: localStorage.getItem("userPhone") || "",
    email: localStorage.getItem("userEmail") || "",
  },
  totalPrice: 0,
  status: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PRICE":
      return { ...state, totalPrice: action.payload };

    case "USER_LOGIN": {
      const updatedUser = {
        isLogin: action.payload.isLogin,
        userId: action.payload.userId || state.userInfo.userId,
        name: action.payload.name || state.userInfo.name,
        email: action.payload.email || state.userInfo.email,
        phone: action.payload.phone || state.userInfo.phone,
      };

      // persist to localStorage
      localStorage.setItem("isLogin", updatedUser.isLogin);
      localStorage.setItem("userId", updatedUser.userId || "");
      localStorage.setItem("userName", updatedUser.name || "");
      localStorage.setItem("userEmail", updatedUser.email || "");
      localStorage.setItem("userPhone", updatedUser.phone || "");

      return { ...state, userInfo: updatedUser };
    }

    case "LOGOUT":
      localStorage.setItem("isLogin", "false");
      localStorage.removeItem("userId");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userPhone");

      return {
        ...state,
        userInfo: { isLogin: false, userId: "", name: "", phone: "", email: "" },
      };

    case "SET_REPORT_STATUS":
      return { ...state, status: !state.status };

    default:
      return state;
  }
};

export function StoreProvider(props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { state, dispatch };
  return <Store.Provider value={value}>{props.children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
