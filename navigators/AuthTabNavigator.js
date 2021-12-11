// import { createSwitchNavigator, createAppContainer } from 'react-navigation';

// import AuthNavigator from './AuthNavigator';



// const AuthNav = createSwitchNavigator({
//     Auth: AuthNavigator,
// },
// {
    
//     initialRouteName: "Auth",
// });

// export default createAppContainer(AuthNav);


import React from 'react';
import { SafeAreaView } from 'react-native';
import { MaterialTopTabBar, createMaterialTopTabNavigator } from 'react-navigation-tabs';
import Colors from '../constants/Colors'

import SignIn from '../screens/Authentication/SignIn'
import SignUp from '../screens/Authentication/SignUp'


class MaterialTopTabBarWrapper extends React.Component {
    render() {
      return (
        <SafeAreaView
          forceInset={{ top: 'always', horizontal: 'never', bottom: 'never'}}
          style={{backgroundColor: 'white'}}
          >
          <MaterialTopTabBar {...this.props} />
        </SafeAreaView>
      );
    }
  }

const AuthenticationTabNav = createMaterialTopTabNavigator({
    SignIn: {
        screen: SignIn,
        navigationOptions: {
            tabBarLabel: 'Sign In',
        }
    },
    SignUp: {
        screen: SignUp,
        navigationOptions: {
            tabBarLabel: 'Sign Up',
        },
    },
    
},
{
    tabBarComponent: MaterialTopTabBarWrapper,
    initialRouteName: "SignIn",
    navigationOptions:{
        headerStyle: { borderBottomColor: 'transparent' },
        
    },
    tabBarOptions: {
        labelStyle: {
          fontSize: 14,
          color: Colors.apollo900,
        },
        indicatorStyle: {
            backgroundColor: Colors.tango900,

        },
        tabStyle: {
          
        },
        style: {
          backgroundColor: "white",
          borderTop: 'transparent',
        },
      },
    
    headerMode: "none", 
});

export default AuthenticationTabNav;