import React from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView } from 'react-native';
import Text from '../components/Txt'
import Input from '../components/Input'
import Icon from '../components/Icon'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import LinearGradient from 'react-native-linear-gradient'
import FloatingCircles from '../components/FloatingCircles'

//MobX Imports
import {inject, observer} from 'mobx-react/native'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';


@inject("UserStore", "ComponentStore")
@observer
class EditPayment extends React.Component{
    _isMounted = false;

    static navigationOptions = ({ navigation }) => {
        return{
        title: "Manage My Payment",
        headerTitleStyle:{
            fontWeight: "300",
            fontSize: 18,
        },    
    };};

    constructor(props){
        super(props);

        this.state = {
            creditCardNum: '•••• •••• •••• ' + this.props.ComponentStore.selectedPayment[0].Number,
            creditCardType: this.props.ComponentStore.selectedPayment[0].CardType,
            creditCardFormat: this.props.ComponentStore.selectedPayment[0].CardType,
            name: this.props.ComponentStore.selectedPayment[0].Name,
            CCV: this.props.ComponentStore.selectedPayment[0].CCV,
            type: this.props.ComponentStore.selectedPayment[0].Type,
            exp: this.props.ComponentStore.selectedPayment[0].Month + "" + this.props.ComponentStore.selectedPayment[0].Year,
            expMonth: this.props.ComponentStore.selectedPayment[0].Month,
            expYear: this.props.ComponentStore.selectedPayment[0].Year,
            StripecardId: this.props.ComponentStore.selectedPayment[0].StripeID,

            CCVError: "",
            creditCardNumError: "",
            nameError: "",
            expError: "",
            allValid: false,

            authenticating: false,
        }
    }

    componentDidMount(){
        this._isMounted = true;
        this._navListener = this.props.navigation.addListener('didFocus', () => {
         StatusBar.setBarStyle('dark-content', true);
         Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
       });
    }

    deleteSource = async () => {

        const settings = {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
                // { CardType, Month, Name, Number, PaymentID, StripeID, StripePMID, Type, Year, CCV } = this.props.ComponentStore.selectedPayment[0]
                FBID: this.props.UserStore.userID,

                CardType: this.props.ComponentStore.selectedPayment[0].CardType,
                Month: this.props.ComponentStore.selectedPayment[0].Month,
                Name: this.props.ComponentStore.selectedPayment[0].Name,
                Number: this.props.ComponentStore.selectedPayment[0].Number,
                PaymentID: this.props.ComponentStore.selectedPayment[0].PaymentID,
                StripeID: this.props.ComponentStore.selectedPayment[0].StripeID,
                StripePMID: this.props.ComponentStore.selectedPayment[0].StripePMID,
                Type: "Card",
                Year: this.props.ComponentStore.selectedPayment[0].Year,
                CCV: this.props.ComponentStore.selectedPayment[0].CCV
          })
        }






        try{ 
          const fetchResponse = await fetch('https://us-central1-riive-parking.cloudfunctions.net/deleteSource', settings)
          const data = await fetchResponse.json();
          return data;
        }catch(e){
          alert(e);
        }    
      }

    deletePayment = async () => {

        if(this._isMounted){
          await this.setState({authenticating: true})

     
        this.deleteSource().then(result => {  
          // console.log(result.removedCardID)
            if(result.statusCode !== 200){
                throw new Error(`Failed to delete card.`)
            }else{
              const updatedPaymentArray = this.props.UserStore.payments.filter(i => i.PaymentID !== result.removedCardID);
              this.props.UserStore.payments = updatedPaymentArray;
              this.props.navigation.navigate("Profile")
            }
        
        }).catch(async(err) => {
          await this.setState({authenticating: false})
          alert(err)
        })
        

          // remove the old vehicle from the userstore mobx vehicles array
       
       
        

        // navigate back to home.
        // this.props.navigation.navigate("Profile")
 
     
        }
    }

    render(){
        return(
            // <View>
            //     <Text>{this.props.ComponentStore.selectedPayment[0].PaymentID}</Text>
            // </View>
      <ScrollView style={{flex: 1, backgroundColor: "white", }}>
      <SafeAreaView style={{flex: 0}} />
      <View style={styles.container}>
        <LinearGradient colors={[Colors.apollo500, Colors.apollo700]} style={styles.creditCard}>
            <Icon 
              iconName={this.state.creditCardType !== '' ? 'cc-' + this.state.creditCardType : 'credit-card'}
              iconLib="FontAwesome"
              iconColor={Colors.mist300}
              iconSize={28}
              style={{ marginLeft: "auto"}}
            />
            <View style={{justifyContent: 'flex-end'}}>
            <Text style={{color: Colors.mist300, fontSize: 18}}>{this.state.creditCardNum ? this.state.creditCardNum : 'XXXX XXXX XXXX XXXX'}</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{color: Colors.mist300, fontSize: 10, marginBottom: 20, marginLeft: 5}}>{this.state.CCV ? this.state.CCV : 'CCV'}</Text>
              <Text style={{color: Colors.mist300, fontSize: 10}}>GOOD {"\n"} THRU {"\n"}</Text>
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.creditCardText}>{this.state.name == "" ? 'Firstname Lastname' : this.state.name}</Text>               
              <Text style={styles.creditCardText}>{this.state.exp == "" ? "MM/YY" : this.state.exp.length == 4 ? this.state.expMonth + '/' + this.state.expYear : "0" + this.state.expMonth + '/' + this.state.expYear }</Text>
            </View>
            </View>
        </LinearGradient>
        {/* <View style={{flexDirection: 'row'}}>
          <View style={{marginRight: 16, flex: 5}}>
            <Input 
              placeholder='XXXXXXXXXXXXXXXX'
              mask='credit-card'
              ccType = {this.state.creditCardFormat}
              label="Credit Card Number"
              name="CCNum"
              onChangeText = {cc => {this.setState({creditCardNum: cc}); this.getCardType(cc)}}
              value={this.state.creditCardNum}
              error={this.state.creditCardNumError}
            />
          </View>
          <View style={{flex: 2}}>
                <Input 
                    placeholder='MM/YY'
                    mask='mm/yy'
                    label="Expiration"
                    name="expiration"
                    onChangeText = {i => this.cardExpirationDate(i)}
                    value={this.state.exp}
                    keyboardType='numeric' 
                    error={this.state.expError}
                  />
            </View>
          
         </View>
          <View style={{flexDirection: 'row'}}>
            
           <View style={{marginRight: 16, flex: 3}}>
            <Input 
              placeholder="Your name..."
              label="Name"
              name="name"
              onChangeText={(n) => this.setState({name: n})}
              value={this.state.name}
              maxLength={40}
              error={this.state.nameError}
            />
           </View> 
           <View  style={{flex: 1}}>
            <Input 
              placeholder={this.state.creditCardType == 'amex' ? '0000' : '000'}
              label="CCV"
              name="ccv"
              onChangeText={(ccv) => this.setState({CCV: ccv})}
              value={this.state.CCV}
              maxLength={this.state.creditCardType == 'amex' ? 4 : 3}
              keyboardType='numeric' 
              error={this.state.CCVError}
              />
          </View>  
          </View> */}
        <Button style={{backgroundColor: 'white', borderColor: Colors.hal300, borderWidth: 2}} textStyle={{color: Colors.hal300}} disabled={this.state.authenticating} onPress={() => this.deletePayment()}>{this.state.authenticating ? <FloatingCircles color={Colors.hal300}/> : "Delete Card"}</Button>
      </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    padding: 20,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center'

  },
  creditCard: {
    width: "100%",
    height: 200,
    marginBottom: 20,
    // backgroundColor: Colors.apollo500,
    borderRadius: 10,
    padding: 15,
    justifyContent: "space-between",
  },
  creditCardText: {
    color: Colors.mist300,
    fontSize: 16,
    alignSelf: "flex-end"
  }
})

export default EditPayment;