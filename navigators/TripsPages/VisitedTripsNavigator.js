import React from 'react'
import { createStackNavigator } from 'react-navigation-stack'


import VisitedTrips from '../../screens/VistingTrips'
import TOS from '../../screens/LegalScreens/Tos'


const VisitedTripsNavigator = createStackNavigator({
    VisitedTrips: {
        screen: VisitedTrips,
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

export default VisitedTripsNavigator;