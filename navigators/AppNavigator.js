import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import Authentication from './AuthTabNavigator'
import Navigator from './MainNavigator'
import TOS from './LegalNavigator'

import AuthTOS from './AuthAndTOS'


const AuthNavigator = createSwitchNavigator({
    Auth: AuthTOS,
    Home: Navigator,
    
},
{
    initialRouteName: "Auth",

});

export default createAppContainer(AuthNavigator);