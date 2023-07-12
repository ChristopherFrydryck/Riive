import React from 'react'
import { View, StyleSheet, TouchableHighlight, Dimensions, TouchableOpacity } from 'react-native';
import Text from './Txt'
import Colors from '../constants/Colors'
import Icon from './Icon'
import { withNavigation } from 'react-navigation';



//MobX Imports
import {inject, observer} from 'mobx-react'
import UserStore from '../stores/userStore'
import ComponentStore from '../stores/componentStore'


//For Shimmer
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient'
import Svg, {Circle, Rect} from 'react-native-svg'






@inject("UserStore", "ComponentStore")
@observer
class VehicleList extends React.Component{
    constructor(){
        super();
        
       
    }

    async componentDidMount(){
        this.props.ComponentStore.paymentsLoaded = true;
    }

    selectPayment = (payment) => {
        this.props.ComponentStore.selectedPayment = [];
        this.props.ComponentStore.selectedPayment.push({
            CardType: payment.CardType,
            Month: payment.Month,
            Name: payment.Name,
            Number: payment.Number,
            PaymentID: payment.PaymentID,
            StripeID: payment.StripeID,
            StripePMID: payment.StripePMID,
            Type: payment.Type,
            Year: payment.Year,
            CCV: payment.CCV,
        })
        // alert(this.props.ComponentStore.selectedVehicle[0].Year + " " + this.props.ComponentStore.selectedVehicle[0].Make + " " + this.props.ComponentStore.selectedVehicle[0].Model)
        this.props.navigation.navigate("EditPayment")
    }


    render(){
        let yearString = new Date().getFullYear().toString().substr(-2);
        let lastTwoYear = parseInt(yearString, 10);
        let month = new Date().getMonth();
        let {paymentsLoaded} =  this.props.ComponentStore;
        let {payments} = this.props.UserStore;
        let loaders = [];


        
        if(paymentsLoaded){
        return(
            
            <View style={styles.container}>
                <TouchableOpacity
                    // key={payment.PaymentID}
                    style={styles.li_first}
                    // onPress = {() => this.selectPayment(payment)}
                    disabled={true}
                >
                    <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap'}}>
                            <Icon
                                iconName="dollar-sign"
                                iconColor={Colors.apollo500}
                                iconSize={28}
                                style={{marginRight: 8}}
                                
                            />
                            <View style={{flexDirection: "column"}}>
                                <Text style={{fontSize: 16}}>Riive Credit</Text>
                                <Text style={{flexWrap: 'wrap'}}>{(this.props.UserStore.accountBalance / 100).toLocaleString("en-US", {style:"currency", currency:"USD"})}</Text>
                            </View>

                        </View> 
                </TouchableOpacity>
                
                {
                    
                   payments.map((payment, i) => (
                        
                        <TouchableOpacity
                            key={payment.PaymentID}
                            style={i == 0 ? styles.li_first : styles.li}
                            onPress = {() => this.selectPayment(payment)}
                            >
                            {payment.Type == "Card" ?   
                            <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap'}}>
                                <Icon
                                    iconName="credit-card"
                                    iconColor={Colors.apollo500}
                                    iconSize={28}
                                    style={{marginRight: 8}}
                                    
                                />
                                {payments[i].Year > lastTwoYear || payments[i].Year === lastTwoYear && payments[i].Month >= month ? 
                                    <View style={{flexDirection: "column"}}>
                                    {payment.CardType == 'diners-club' ? 
                                    <Text style={styles.cardTitle}>Diners Club Card</Text>: payment.CardType == 'jcb' ? 
                                    <Text style={styles.cardTitle}>JCB Card</Text> : payment.CardType == 'mastercard' ? 
                                    <Text style={styles.cardTitle}>Mastercard</Text> : 
                                    <Text style={styles.cardTitle}>{payment.CardType.charAt(0).toUpperCase() + payment.CardType.slice(1)} Card</Text>}
                                    
                                    {payment.CardType == 'diners-club'? <Text>••••••••••••{payment.Number}</Text> : 
                                    payment.Type == "amex" ? <Text>•••••••••••{payment.Number}</Text> : 
                                    <Text>••••••••••••{payment.Number}</Text>}
                                </View>
                                : <View style={{flexDirection: "column"}}>
                                    {payment.CardType == 'diners-club' ? 
                                    <Text style={styles.cardTitleExpired}>Diners Club Card</Text>: payment.CardType == 'jcb' ? 
                                    <Text style={styles.cardTitleExpired}>JCB Card</Text> : payment.CardType == 'mastercard' ? 
                                    <Text style={styles.cardTitleExpired}>Mastercard</Text> : 
                                    <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}><Text style={styles.cardTitleExpired}>{payment.CardType.charAt(0).toUpperCase() + payment.CardType.slice(1)} Card</Text><Text style={styles.expiredText}>Expired</Text></View>}

                                    {payment.CardType == 'diners-club' ? <Text>••••••••••••{payment.Number}</Text> : 
                                    payment.Type == "amex" ? <Text>•••••••••••{payment.Number}</Text> : 
                                    <Text>••••••••••••{payment.Number}</Text>}
                                </View>}
                                
                                <View style={{position:"absolute", right:0}}>
                                    <Icon 
                                        iconName="chevron-right"
                                        iconColor={Colors.mist900}
                                        iconSize={28}
                                    />
                                </View>
    
                            </View>
                            : payment.Type == "PayPal" ?
                            <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap'}}>
                                <Icon
                                    iconLib = "Entypo"
                                    iconName="paypal"
                                    iconColor={Colors.apollo500}
                                    iconSize={28}
                                    style={{marginRight: 8}}
                                    
                                />
                                <View style={{flexDirection: "column"}}>
                                    <Text style={{fontSize: 16}}>{payment.Type}</Text>
                                    <Text style={{flexWrap: 'wrap'}}>{payment.Email}</Text>
                                </View>
                                <View style={{position:"absolute", right:0}}>
                                    <Icon 
                                        iconName="chevron-right"
                                        iconColor={Colors.mist900}
                                        iconSize={28}
                                    />
                                </View>

                            </View> 
                        : payment.Type == "Venmo" ?
                        <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap'}}>
                            <Icon
                                iconLib = "MaterialCommunityIcons"
                                iconName="venmo"
                                iconColor={Colors.apollo500}
                                iconSize={28}
                                style={{marginRight: 8}}
                                
                            />
                            <View style={{flexDirection: "column"}}>
                                <Text style={{fontSize: 16}}>{payment.Type}</Text>
                                <Text style={{flexWrap: 'wrap'}}>{payment.Email}</Text>
                            </View>
                            <View style={{position:"absolute", right:0}}>
                                <Icon 
                                    iconName="chevron-right"
                                    iconColor={Colors.mist900}
                                    iconSize={28}
                                />
                            </View>
                        </View> 
                        :
                        <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap'}}>
                                <Icon
                                    iconName="dollar-sign"
                                    iconColor={Colors.apollo500}
                                    iconSize={28}
                                    style={{marginRight: 8}}
                                    
                                />
                                <View style={{flexDirection: "column"}}>
                                    <Text style={{fontSize: 16}}>{payment.Type}</Text>
                                    <Text style={{flexWrap: 'wrap'}}>{payment.Email}</Text>
                                </View>
                                <View style={{position:"absolute", right:0}}>
                                    <Icon 
                                        iconName="chevron-right"
                                        iconColor={Colors.mist900}
                                        iconSize={28}
                                    />
                                </View>

                            </View> 
                            }
                           
                           
                        </TouchableOpacity>
                        
                    ))
                }
            </View>
            
        )}else{
            for(let i = 0; i < this.props.UserStore.vehicles.length; i++){
                loaders.push(
                    <SvgAnimatedLinearGradient key={i} width={Dimensions.get('window').width} height="50">
                        <Rect width={Dimensions.get('window').width} height="40" rx="5" ry="5" />
                    </SvgAnimatedLinearGradient>
                )
            }
            return(
                <View style={styles.container}>{loaders}</View>
                
                    
                
            )
        }
    
    }
}



const styles = StyleSheet.create({
    container:{
        marginTop: 10,
    },
    li: {
        borderBottomColor: Colors.mist700,
        borderBottomWidth: 1,
        padding: 15,

       
    },
    li_first: {
        borderTopWidth: 1,
        borderTopColor: Colors.mist700,
        borderBottomColor: Colors.mist700,
        borderBottomWidth: 1,
        padding: 10,
    },
    cardTitle: {
        fontSize: 16,
    },
    cardTitleExpired: {
        fontSize: 16,
        color: Colors.cosmos300,
        textDecorationLine: 'line-through',
        textDecorationStyle: 'solid',
    },
    expiredText: {
        fontSize: 14,
        color: Colors.hal500,
    }
})

export default withNavigation(VehicleList)