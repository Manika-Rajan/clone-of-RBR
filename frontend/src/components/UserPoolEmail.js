import { CognitoUserPool } from "amazon-cognito-identity-js";
const poolData1 = {
    UserPoolId : "ap-south-1_R7RCO60nQ",
    ClientId: "1p0bbkvbnucrrap734shic92d7"
}

export default new CognitoUserPool(poolData1);