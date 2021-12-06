import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import Colors from '../constants/Colors'

import PrivacyPolicy from '../screens/LegalScreens/PrivacyPolicy'
import TOS from '../screens/LegalScreens/Tos'

const PrivacyNavigator = createMaterialTopTabNavigator({
    TOS: {
        screen: TOS,
        navigationOptions: {
            tabBarLabel: 'Terms of Service',
        }
    },
    PrivacyNavigator: {
        screen: PrivacyPolicy,
        navigationOptions: {
            tabBarLabel: 'Privacy Policy',
        }
    },
    
},
{
    
    initialRouteName: "TOS",
    navigationOptions:{
        title:"Terms and Privacy Policy",
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
    
});

export default PrivacyNavigator;