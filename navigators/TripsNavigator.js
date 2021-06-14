import React from 'react'
import { SafeAreaView } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack'
import Colors from '../constants/Colors'

import TripsTabNavigator from './TripsTabNavigator'
import EditTrip from '../screens/EditTrip'

import HostedTrips from './TripsPages/HostedTripsNavigator'
import VisitingTrips from './TripsPages/VisitedTripsNavigator'



const TripsNavigator = createStackNavigator({
  TripsTabNavigator: {
      screen: TripsTabNavigator,
      navigationOptions: {
          headerShown: false,
      }
  },
  EditTrip: EditTrip,
}, 
{initialRouteName: "TripsTabNavigator",})
  

// const TripsNavigator = createMaterialTopTabNavigator({
//     VisitingTrips: {
//         screen: VisitingTrips,
//         navigationOptions: {
//             tabBarLabel: 'Visiting Trips',
//         }
//     },
//     HostedTrips: {
//         screen: HostedTrips,
//         navigationOptions: {
//             tabBarLabel: 'Hosted Trips',
//         }
//     },    
// },
// {   
//     tabBarComponent: MaterialTopTabBarWrapper,
//     initialRouteName: "VisitingTrips",
//     navigationOptions:{
//         title: "Trips",
//         headerStyle: { borderBottomColor: 'transparent' },
        
//     },
//     tabBarOptions: {
//         labelStyle: {
//           fontSize: 14,
//           color: Colors.cosmos900,
//         },
//         indicatorStyle: {
//             backgroundColor: Colors.tango900,

//         },
//         tabStyle: {
          
//         },
//         style: {
//           backgroundColor: "white",
//           borderTop: 'transparent',
//         },
//       },
    
//     headerMode: "none", 
// });

export default TripsNavigator;