import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import Authentication from '../screens/Authentication'
import Navigator from './MainNavigator'


const AuthNavigator = createSwitchNavigator({
    Auth: Authentication,
    Home: Navigator
},
{
    
    initialRouteName: "Auth",
});

export default createAppContainer(AuthNavigator);