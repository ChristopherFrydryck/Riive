import React from 'react'
import { createStackNavigator } from 'react-navigation-stack'


import Home from '../screens/HomeScreen'
import ExternalProfile from '../screens/ExternalProfile'
import ExternalSpace from '../screens/ExternalSpace'
import ReserveSpace from '../screens/ReserveSpace'
import ReservationConfirmed from '../screens/ReservationConfirmed'

import TermsOfService from '../screens/LegalScreens/Tos'

import AddVehicle from '../screens/AddVehicle'
import AddPayment from '../screens/AddPayment'


const HomeNavigator = createStackNavigator({
    Home: {
        screen: Home,
        navigationOptions: {
            headerShown: false,
        }
    },
    ExternalProfile: {
        screen: ExternalProfile, 
        navigationOptions: {
            title: "Profile",
            headerShown: false,
        },
        headerTintColor: 'black'
    },
    ExternalSpace: {
        screen: ExternalSpace, 
    },
    ReserveSpace: {
        screen: ReserveSpace, 
        navigationOptions: {
            title: "Reserve Space",
            headerTitleStyle:{
                fontWeight: "300",
                fontSize: 18,
            },
            headerTintColor: 'black'
        }
    },
    ReservationConfirmed: {
        screen: ReservationConfirmed,
        navigationOptions: {
            headerShown: false,
            gestureEnabled: false,
        }
    },
    TermsOfService: {
        screen: TermsOfService,
        navigationOptions: {
            title: "Terms of Service",
            headerTitleStyle:{
                fontWeight: "300",
                fontSize: 18,
            },
            headerTintColor: 'black'
        }
    },
    AddVehicle: {
        screen: AddVehicle, 
    },
    AddPayment: {
        screen: AddPayment, 
    },
},
{
    initialRouteName: "Home",
    
});

export default HomeNavigator;