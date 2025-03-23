import { createContext, useReducer } from "react";


export const Store=createContext();

const initialState={
    isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
    name: localStorage.getItem("name") || "",
    userId: localStorage.getItem("userId") || "",
    phone:'',
    email:'',
    totalPrice:0,   
    status:false, 
}


const reducer=(state,action)=>{
    switch(action.type){
        case 'SET_PRICE':
            return{ ...state, totalPrice:action.payload }
        case 'USER_LOGIN':
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("name", action.payload?.name || '');
              if (action.payload?.userId) {
                    localStorage.setItem("userId", action.payload.userId); // 👈 Optional addition
                  }
                  return {
                    ...state,
                    isLoggedIn: true,
                    name: action.payload?.name || '',
                    userId: action.payload?.userId || state.userId, // 👈 Ensure consistency
                  };
        case 'SET_USER_ID':
              localStorage.setItem("userId", action.payload);
              return { ...state, userId: action.payload };
        case 'SET_NAME':
            localStorage.setItem("name", action.payload);
            return { ...state, name: action.payload };
        case 'SET_PHONE':
                return { ...state, phone: action.payload };
        case 'SET_EMAIL':
                return  {...state,email:action.payload}
        case 'SET_REPORT_STATUS':
                    return  {...state,status:!(state.status)}
           

          case 'LOGOUT':
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("name");
            localStorage.removeItem("userId");
            return {
                ...state,
                isLoggedIn: false,
                name: '',
                userId: '',
                phone: '',
                email: '',
                totalPrice: 0,
                status: false,
            };
        
        default:
            return state
    }
}

export function StoreProvider(props){
    const [state,dispatch]=useReducer(reducer,initialState);
    const value={state,dispatch}
    return <Store.Provider value={value}>{props.children}</Store.Provider>
}
