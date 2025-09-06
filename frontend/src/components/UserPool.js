import { CognitoUserPool } from "amazon-cognito-identity-js";
const poolData = {
    UserPoolId : "ap-south-1_9meTm9obo",
    ClientId: "1glle7bvkfkrqt77p19jpqelss"
}
const userPool = new CognitoUserPool(poolData);
export default userPool;