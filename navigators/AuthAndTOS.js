import { createStackNavigator } from 'react-navigation-stack'
import Authentication from './AuthTabNavigator'
import TOS from './LegalNavigator'


const AuthAndTOSNavigator = createStackNavigator({
    Auth: {
        screen: Authentication,
        navigationOptions: {
            title: "Sign Up",
            header: null
        }
    },
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

export default AuthAndTOSNavigator;