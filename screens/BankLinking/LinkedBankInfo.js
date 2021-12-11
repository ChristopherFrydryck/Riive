import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox, Alert, Linking} from 'react-native';

import Text from '../../components/Txt'
import Icon from '../../components/Icon'
import Button from '../../components/Button'
import Colors from '../../constants/Colors'

//MobX Imports
import {inject, observer} from 'mobx-react'


@inject("UserStore", "ComponentStore")
@observer
export default class BankLinking extends Component {
    _isMounted = false;

    static navigationOptions = {
        title: "Your Bank Information",
        headerTitleStyle:{
            fontWeight: "500",
            fontSize: 18,
        }
    }

    constructor(props){
        super(props)

    }

    async componentDidMount(){
        // Set Status Bar page info here!
        this._isMounted = true;
        this._navListener = this.props.navigation.addListener('didFocus', () => {
           StatusBar.setBarStyle('dark-content', true);
           Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
         });
         
      }

      render(){
          let {type, number, bankProvider, bankToken, cardType, fingerprint, id} = this.props.UserStore.directDepositInfo
          return(
              <ScrollView style={{backgroundColor: 'white', paddingTop: 16}} contentContainerStyle={{flex: 1, justifyContent: 'center'}}>
                  <View style={styles.container}>
                    <Icon 
                        iconName="coins"
                        iconLib="FontAwesome5"
                        iconSize={28}
                        style={{marginBottom: 12}}
                    />
                    <Text style={{fontSize: 20, marginBottom: 4}} type="SemiBold">Payments & Payouts</Text>
                    <Text style={{marginBottom: 8}}>In order for hosts to get payment for sharing their space, or for guests to get a refund, we need to link a payment method to the account to allow for a safe and secure transfer of funds.</Text>
                    <Text>Accounts can have one connected bank account to have all transfers go to.</Text>
                  </View>
                  {type ? 
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: Colors.mist900, borderTopWidth: 2, borderBottomWidth: 2, paddingVertical: 8, paddingHorizontal: 16, marginTop: 16 }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {type.toUpperCase() === "BANK ACCOUNT" ? 
                    <Icon 
                        iconName="bank"
                        iconLib="MaterialCommunityIcons"
                        iconColor="black"
                        iconSize={32}
                        onPress={() => alert("pressed 2!")}
                        style={styles.icon}
                    />
                    : type.toUpperCase() === "CARD" ?
                    <Icon
                        iconName="credit-card"
                        iconColor="black"
                        iconSize={32}
                        style={styles.icon}          
                    />
                    : 
                    <Icon
                        iconName="question"
                        iconLib="AntDesign"
                        iconColor="black"
                        iconSize={32}
                        style={styles.icon}          
                    />}
                    <View>
                        <Text style={{fontSize: 12}}>{type.toUpperCase() === "CARD" ? cardType : bankProvider}</Text>
                        <Text>{type.toUpperCase() === "CARD" ? `•••• •••• •••• ${number}` : `•••••••• ${number}`}</Text>
                    </View>
                    </View>
                    <View style={{backgroundColor: "rgba(251, 178, 68, 0.3)", borderRadius: 4, paddingHorizontal: 4, }}>
                        <Text type="Medium" style={{fontSize: 14, color: Colors.tango900}}>DEFAULT</Text>
                    </View>
                  </View>
                : null}
                <View style={styles.container}>
                <Button style={{backgroundColor: Colors.apollo700}} textStyle={{color: 'white'}} onPress={() => this.props.navigation.navigate("BankLinkNavigator")}>{type ? "Change Payout Method" : "Add Payout Method"}</Button>
                </View>
                  
              </ScrollView>
          )
      }
      
}
const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16
    }, 
    icon:{
        paddingRight: 8
    }
})