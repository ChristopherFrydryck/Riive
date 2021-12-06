import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import Authentication from './AuthTabNavigator'
import Navigator from './MainNavigator'


const AuthNavigator = createSwitchNavigator({
    Auth: Authentication,
    Home: Navigator,
},
{
    
    initialRouteName: "Auth",
});

export default createAppContainer(AuthNavigator);