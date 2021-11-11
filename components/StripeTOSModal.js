import React, { PureComponent, Children } from 'react'
import {View, StyleSheet, Dimensions, Modal, Animated, Platform, Vibration, ScrollView, Pressable} from 'react-native'

import Text from '../components/Txt'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Image from '../components/Image'

import Colors from '../constants/Colors'

import { Checkbox } from 'react-native-paper';

import storage from '@react-native-firebase/storage'
import firestore from '@react-native-firebase/firestore'
import auth, { firebase } from '@react-native-firebase/auth';

//MobX Imports
import {inject, observer} from 'mobx-react/native'


@inject("UserStore")
@observer
export default class StripeTOSModal extends React.Component{

    constructor(props){
        super(props)

        this.state = {
            agreedToTOS: "unchecked",
        }
    }

    updateStripeTOS = async () => {

        const settings = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            stripeConnectID: this.props.UserStore.stripeConnectID,
        })
        }
    
        if(this.state.ssn != ""){
        try{  
            const fetchResponse = await fetch(`https://us-central1-${config.FIREBASEAPPID}.cloudfunctions.net/agreeToStripeTOS`, settings)
            const data = await fetchResponse;
            if(data.status !== 200){
            throw "Failure to agree to TOS."
            }
            return data;
        }catch(e){
            throw e
        }  
        }else{
        throw "Failure to agree to TOS.";
        }
        
    }

    render(){
        return(
            <Modal style={{zIndex: 99999, elevation: 99999, flex: 1}} visible={this.props.visible} transparent={true}>
                <View style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, backgroundColor: 'rgba(176, 176, 176, 0.33)', justifyContent: 'center'}}>
                    <View style={{backgroundColor: 'white', borderRadius: 8, marginHorizontal: 8, paddingHorizontal: 16, paddingVertical: 16, height: Dimensions.get('window').height*(.7)}}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingBottom: 8}}>
                                   <Text numberOfLines={1} type="Medium" style={{fontSize: 24}}>Stripe Terms of Service</Text>
                                   <Icon 
                                        iconName="x"
                                        iconColor={Colors.cosmos500}
                                        iconSize={28}
                                        onPress={this.props.closeModal}
                                        style={{flex: 0}}
                                    />
                        </View>
                        {/* <View style={{flex: 1, backgroundColor: 'orange'}}> */}
                                <ScrollView>
                                    <Text>Payment processing services for users on Riive are provided by Stripe and are subject to the Stripe Connected Account Agreement, which includes the Stripe Terms of Service (collectively, the “Stripe Services Agreement”). By agreeing to this terms of service, you agree to be bound by the Stripe Services Agreement, as the same may be modified by Stripe from time to time. As a condition of Riive enabling payment processing services through Stripe, you agree to provide Riive accurate and complete information about you and your business, and you authorize Riive to share it and transaction information related to your use of the payment processing services provided by Stripe.</Text>
                                </ScrollView>
                                <Pressable style={{height: 40, flexDirection: 'row', alignItems: 'center'}}
                                 onPress={() => {
                                    this.setState({agreedToTOS: this.state.agreedToTOS === "checked" ? "unchecked" : "checked"})
                                    console.log("Pressed")
                                }}>
                                <Checkbox.Android
                                    status={this.state.agreedToTOS}
                                />
                                <Text>I agree to the Stripe Terms of service</Text>
                            </Pressable>
                            <Button disabled={this.state.agreedToTOS !== "checked"} style={this.state.agreedToTOS === "checked" ? {flex: 1, backgroundColor: Colors.apollo900} : {flex: 1, backgroundColor: Colors.cosmos300}} textStyle={{color: Colors.mist300}} onPress={() => console.log("Pressed")}>Continue</Button>
                    </View>
                </View>
            </Modal>
        )
    }
}