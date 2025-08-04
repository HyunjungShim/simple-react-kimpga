import { createBrowserRouter } from "react-router-dom";
import NotificationManager from "../screens/notification/NotificationManager";
import UserSetting from "../screens/setting/UserSetting";
import App from "../App";

export const router = createBrowserRouter([{
    path: "/",
    element: <App />,
    children: [
        {
            path:"",
            element:<NotificationManager/>
        },
        {
            path: "/setting",
            element: <UserSetting />,
        },
    ],
}]);