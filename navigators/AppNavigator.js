import { createSwitchNavigator, createAppContainer } from 'react-navigation';

import AuthNavigator from './AuthNavigator';



const AuthNav = createSwitchNavigator({
    Auth: AuthNavigator,
},
{
    
    initialRouteName: "Auth",
});

export default createAppContainer(AuthNav);