import { createSwitchNavigator, createAppContainer } from 'react-navigation';
import Authentication from './AuthTabNavigator'
import Navigator from './MainNavigator'
import TOS from '../navigators/LegalNavigator'


const AuthNavigator = createSwitchNavigator({
    Auth: Authentication,
    Home: Navigator,
    TOS: {
        screen: TOS,
        navigationOptions: {
            title: "Terms of Service",
            headerTitleStyle:{
                fontWeight: "300",
                fontSize: 18,
            },
            headerTintColor: 'black'
        }
    }
},
{
    initialRouteName: "Auth",
});

export default createAppContainer(AuthNavigator);