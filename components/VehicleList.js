import React from 'react'
import { View, StyleSheet, TouchableHighlight, Dimensions } from 'react-native';
import Text from './Txt'
import Colors from '../constants/Colors'
import Icon from '../components/Icon'
import { withNavigation } from 'react-navigation';



//MobX Imports
import {inject, observer} from 'mobx-react/native'
import UserStore from '../stores/userStore'
import ComponentStore from '../stores/componentStore'
import { TouchableOpacity } from 'react-native-gesture-handler';


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
        this.props.ComponentStore.vehiclesLoaded = true;
    }

    selectCar = (car) => {
        this.props.ComponentStore.selectedVehicle = [];
        this.props.ComponentStore.selectedVehicle.push({
            VehicleID: car.VehicleID,
            Year: car.Year,
            Make: car.Make,
            Model: car.Model,
            Color: car.Color,
            LicensePlate: car.LicensePlate,
        })
        // alert(this.props.ComponentStore.selectedVehicle[0].Year + " " + this.props.ComponentStore.selectedVehicle[0].Make + " " + this.props.ComponentStore.selectedVehicle[0].Model)
        this.props.navigation.navigate("EditVehicle")
    }


    render(){
        let {vehiclesLoaded} =  this.props.ComponentStore;
        let loaders = [];
        if(vehiclesLoaded){
        return(
            <View style={styles.container}>
                {
                    this.props.UserStore.vehicles.map((car, i) => (
      
                        <TouchableOpacity
                            key={this.props.UserStore.vehicles[i].VehicleID}
                            style={i == 0 ? styles.li_first : styles.li}
                            onPress = {() => this.selectCar(car)}
                            >
                               
                            <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap'}}>
                                <Icon
                                    iconName="navigation"
                                    iconColor={Colors.apollo500}
                                    iconSize={28}
                                    style={{marginRight: 8}}
                                    
                                />
                                <View style={{flexDirection: "column"}}>
                                {(car.Year + " " + car.Make + " " + car.Model).length <= 28 ?
                                <Text style={{fontSize: 16}}>{car.Year} {car.Make} {car.Model}</Text>
                                : <Text style={{fontSize: 16}}>{(car.Year + " " + car.Make + " " + car.Model).substring(0, 28) + "..."}</Text>}
                                <Text style={{flexWrap: 'wrap'}}>{car.LicensePlate}</Text>
                                </View>
                                <View style={{position:"absolute", right:0}}>
                                    <Icon 
                                        iconName="chevron-right"
                                        iconColor={Colors.mist900}
                                        iconSize={28}
                                    />
                                </View>
    
                            </View>
                           
                           
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
    }
})

export default withNavigation(VehicleList);