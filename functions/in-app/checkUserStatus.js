import React from 'react'
import { Alert, DevSettings } from 'react-native'

import config from 'react-native-config'

// import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
// import 'firebase/firestore';
// import 'firebase/auth';


export default checkUserStatus = async(userID) => {
    try{
        await auth().currentUser.reload();
    }catch(e){
        if(e.code == "auth/user-disabled"){
            const settings = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userID
                })
            }
          
                try{  
                    const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/suspendUser`, settings)
                    const data = await fetchResponse;



                    console.log(data.status)
                    if(data.status !== 200){
                        throw data
                    }else{
                        Alert.alert(
                            "Account Suspension",
                            "Your account has been suspended. Any listings you may have are paused, but you will still be hosting your upcoming guests. For questions, reach out to us at Support@riive.net",
                            [
                                { text: 'Close' , onPress: () =>{
                                    DevSettings.reload();
                                }}
                            ]
                        )
                    }

                    return data


                }catch(e){
                    console.log(e)
                    return e
                }  
                
        }else if(e.code == 'auth/network-request-failed'){
            Alert.alert(
                "Connection Issue.",
                "Looks like there is a connection issue. Check your connection. If the error persists, reach out to us at support@riive.net.",
                [
                    { text: 'Close' , onPress: () =>{
                        auth().currentUser.reload();
                        this.checkUserStatus();
                    }},
                ]
            )
        }else{
            console.log(e.code)
            Alert.alert(
                "Whoops! Something went wrong.",
                "We had issues checking your user credentials. Try logging back in.",
                [
                    { text: 'Close' , onPress: () =>{
                        DevSettings.reload();
                    }}
                ]
            )
        }
       
    }
   
    
}