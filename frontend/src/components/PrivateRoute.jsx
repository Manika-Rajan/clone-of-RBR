import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Store } from "../Store";

const PrivateRoute = ({ children, roleRequired }) => {
  const { state } = useContext(Store);
  const { user } = state;

  if (!user?.isLogin) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" />;

  return children;
};

export default PrivateRoute;
