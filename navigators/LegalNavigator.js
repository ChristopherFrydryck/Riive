import React from 'react';
import { SafeAreaView } from 'react-native';
import { MaterialTopTabBar, createMaterialTopTabNavigator } from 'react-navigation-tabs';
import Colors from '../constants/Colors'

import PrivacyPolicy from '../screens/LegalScreens/PrivacyPolicy'
import TOS from '../screens/LegalScreens/Tos'

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

const PrivacyNavigator = createMaterialTopTabNavigator({
    TOS: {
        screen: TOS,
        navigationOptions: {
            tabBarLabel: 'Terms of Service',
        },
    },
    PrivacyNavigator: {
        screen: PrivacyPolicy,
        navigationOptions: {
            tabBarLabel: 'Privacy Policy',
        }
    },
    
},
{
    tabBarComponent: MaterialTopTabBarWrapper,
    initialRouteName: "TOS",
    navigationOptions:{
        title:"Terms and Privacy Policy",
        headerStyle: { borderBottomColor: 'transparent' },
        headerBackTitle: 'Back'
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
    
});

export default PrivacyNavigator;