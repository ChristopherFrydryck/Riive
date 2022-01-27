import React from 'react'
import { Alert, DevSettings } from 'react-native'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import 'firebase/firestore';
import 'firebase/auth';


export default checkUserStatus = async() => {
    try{
        await auth().currentUser.reload();
    }catch(e){
        Alert.alert(
            "Whoops! Something went wrong.",
            "We had issues gathering your user data. Try logging back in.",
            [
                { text: 'Close' , onPress: () =>{
                    DevSettings.reload();
                }}
            ]
        )
    }
   
    
}