import React from 'react'
import { createStackNavigator } from 'react-navigation-stack'


import HostedTrips from '../../screens/HostedTrips'
import TOS from '../../screens/LegalScreens/Tos'


const HostedTripsNavigator = createStackNavigator({
    VisitedTrips: {
        screen: HostedTrips,
        navigationOptions: {
            title: "Back",
            headerShown: false,
            gestureEnabled: false,
        }
    },
    TOS: {
        screen: TOS,
        navigationOptions: {
            title: "Terms of Service",
        },
    },
},
{
    initialRouteName: "VisitedTrips",
    
    
    
});

export default HostedTripsNavigator;