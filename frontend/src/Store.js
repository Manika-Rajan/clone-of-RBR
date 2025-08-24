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

  // ✅ add report state
  report: {
    fileKey: localStorage.getItem("reportFileKey") || "",
    reportId: localStorage.getItem("reportId") || "",
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_PRICE":
      return { ...state, totalPrice: action.payload };

    case "USER_LOGIN": {
      const updatedUser = {
        isLogin: action.payload.isLogin === true,
        userId: action.payload.userId || state.userInfo.userId || Date.now().toString(),
        name: action.payload.name || state.userInfo.name,
        email: action.payload.email || state.userInfo.email,
        phone: action.payload.phone || state.userInfo.phone,
      };

      // ✅ persist to localStorage
      localStorage.setItem("isLogin", updatedUser.isLogin ? "true" : "false");
      localStorage.setItem("userId", updatedUser.userId);
      localStorage.setItem("userName", updatedUser.name);
      localStorage.setItem("userEmail", updatedUser.email);
      localStorage.setItem("userPhone", updatedUser.phone);

      console.log("🔑 USER_LOGIN reducer applied, updatedUser:", updatedUser);

      return { ...state, userInfo: updatedUser };
    }

    case "LOGOUT":
      localStorage.setItem("isLogin", "false");
      localStorage.removeItem("userId");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userPhone");
      localStorage.removeItem("reportFileKey");
      localStorage.removeItem("reportId");

      return {
        ...state,
        userInfo: { isLogin: false, userId: "", name: "", phone: "", email: "" },
        report: { fileKey: "", reportId: "" },
      };

    case "SET_REPORT": {
      // ✅ persist reportId + fileKey
      localStorage.setItem("reportFileKey", action.payload.fileKey || "");
      localStorage.setItem("reportId", action.payload.reportId || "");

      console.log("📝 SET_REPORT reducer applied:", action.payload);

      return {
        ...state,
        report: {
          fileKey: action.payload.fileKey || "",
          reportId: action.payload.reportId || "",
        },
      };
    }

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
