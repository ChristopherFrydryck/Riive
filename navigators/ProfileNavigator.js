import React from 'react'
import { createStackNavigator } from 'react-navigation-stack'
import LegalNavigator from './LegalNavigator'
import BankLinkNavigator from './BankLinkNavigator'

import Profile from '../screens/ProfileScreen'
import BankInfo from '../screens/BankLinking/LinkedBankInfo'
import AddressAndSSN from '../screens/BankLinking/AddAddrAndSSN'
import AddVehicle from '../screens/AddVehicle'
import EditVehicle from '../screens/EditVehicle'
import AddPayment from '../screens/AddPayment'
import EditPayment from '../screens/EditPayment'
import AddSpace from '../screens/AddSpace'
import EditSpace from '../screens/EditSpace'
import Settings from '../screens/Settings'



const ProfileNavigator = createStackNavigator({
    Profile: {
        screen: Profile,
        navigationOptions: {
            headerShown: false,
        }
    },
    AddVehicle: AddVehicle,
    EditVehicle: EditVehicle,
    AddPayment: AddPayment,
    EditPayment: EditPayment,
    AddSpace: AddSpace,
    EditSpace: EditSpace,
    LegalNavigator: LegalNavigator,
    BankInfo: BankInfo,
    BankLinkNavigator: BankLinkNavigator,
    Settings: Settings,
    AddressAndSSN: AddressAndSSN,
},
{
    
    initialRouteName: "Profile",
    
    
    // headerMode: "none", 
});

export default ProfileNavigator;