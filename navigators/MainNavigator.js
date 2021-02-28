import React from 'react';
import { Platform, StatusBar} from 'react-native';
import { createBottomTabNavigator }  from 'react-navigation-tabs'
// import { createStackNavigator } from 'react-navigation-stack'
import  TripsNavigator  from './TripsNavigator'
// import HomeScreen from '../screens/HomeScreen'
import ProfileNavigator from './ProfileNavigator'
import HomeNavigator from './HomeNavigator'

import TabBarIcon from './TabBarIcon'
import { TabBar } from 'react-native-tab-view';
import Colors from '../constants/Colors';

const navBar =  createBottomTabNavigator(
    {
        Home: {
            screen: HomeNavigator,
            navigationOptions: {
                headerShown: false,
                tabBarLabel: 'Explore',
                title: 'Welcome!',
                tabBarIcon: ({ focused, tintColor }) => (
                    <TabBarIcon 
                        focused={focused}
                        name='search'
                        tintColor={tintColor}
                    />
                )
            }
        },
        Trips: {
            screen: TripsNavigator,
            navigationOptions: {
                headerShown: false,
                tabBarLabel: 'Trips',
                title: 'Your Trips',
                tabBarIcon: ({ focused, tintColor }) => (
                    <TabBarIcon 
                        focused={focused}
                        name='map-pin'
                        tintColor={tintColor}
                    />
                )
            }
        },
        Profile: {
            screen: ProfileNavigator,
            navigationOptions: {
                headerShown: false,
                tabBarLabel: 'Profile',
                title: 'Your Profile',
                tabBarIcon: ({ focused, tintColor }) => (
                    <TabBarIcon 
                        focused={focused}
                        name='user' 
                        tintColor={tintColor}
                    />
                )
            }
        }, 
    },
    {
        initialRouteName: "Home",
        tabBarOptions: {
            activeTintColor: Colors.tango900,
            inactiveTintColor: Colors.cosmos300,
            showIcon: true,
            style: {

                borderTopColor: "transparent",
                paddingTop: 8,
                marginBottom: 4,
                height: 56,
                // backgroundColor: "#efefef"
            },
        },
    }

)



export default navBar;


