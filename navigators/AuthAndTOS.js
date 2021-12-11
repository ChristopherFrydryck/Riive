import { createStackNavigator } from 'react-navigation-stack'
import Authentication from './AuthTabNavigator'
import TOS from './LegalNavigator'
import PWReset from '../screens/Authentication/PasswordReset'


const AuthAndTOSNavigator = createStackNavigator({
    Auth: {
        screen: Authentication,
        navigationOptions: {
            title: "Sign In",
            headerShown: false,
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
    },
    PWReset: {
        screen: PWReset,
        navigationOptions: {
            title: "Password Reset",
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