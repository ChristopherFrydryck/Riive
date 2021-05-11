import { createMaterialTopTabNavigator } from 'react-navigation-tabs';
import Colors from '../constants/Colors'


import DebitLink from '../screens/BankLinking/AddDebitCard'
import BankLink from '../screens/BankLinking/AddDebitCard'

const BankLinkNavigator = createMaterialTopTabNavigator({
    DebitLink: {
        screen: DebitLink,
        navigationOptions: {
            tabBarLabel: 'Debit Card',
        }
    },
    BankLink: {
        screen: BankLink,
        navigationOptions: {
            tabBarLabel: 'Bank Number',
        }
    },
    
},
{
    
    initialRouteName: "DebitLink",
    navigationOptions:{
        title:"Link Your Bank Account",
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
      }
    
    // headerMode: "none", 
});

export default BankLinkNavigator;