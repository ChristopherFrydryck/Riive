import React from "react"
import { View, ScrollView, Picker, StatusBar, StyleSheet, ActivityIndicator, Platform, LogBox} from 'react-native'
import Input from '../components/Input'
import Dropdown from '../components/Dropdown'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import FloatingCircles from '../components/FloatingCircles'
import axios from 'axios'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react/native'

import Cars from '../constants/CarManufacturers'



var unique = []
var d = new Date();
const year = d.getFullYear();


@inject("UserStore", "ComponentStore")
@observer
class AddVehicle extends React.Component{
    _isMounted = false;

    static navigationOptions = {
        title: "Add A Vehicle",
        headerTitleStyle:{
            fontWeight: "300",
            fontSize: 18,
        }
    
    };

    

    constructor(props){
        super(props);

        this.state = {
            yearSelected: null,
            makeSelected: "Choose a Manufacturer...",
            modelSelected: "Car Model...",
            modelEnabled: false,
            licensePlateNum: "",
            vehicleColor: "Black",
            loadingVehicleAPI: false,
            error: {
                year: "",
                make: "",
                model: "",
                licensePlate: "",
                yearValid: false,
                makeValid: false,
                modelValid: false,
                licenseValid: false,
            },
            readyToSubmit: false,
        }

        

    

        
    }

    submitVehicle = async () => {
        const db = firestore();

        if(this._isMounted){

        await this.checkValid();
        if(this.state.error.makeValid && 
            this.state.error.modelValid &&
            this.state.error.yearValid &&
            this.state.error.licenseValid){
                const ref = db.collection("users").doc(); // creates unique ID
                // add vehicle to database
                db.collection("users").doc(this.props.UserStore.userID).update({
                    vehicles: firestore.FieldValue.arrayUnion({
                        VehicleID: ref.id,
                        Year: this.state.yearSelected,
                        Make: this.state.makeSelected,
                        Model: this.state.modelSelected,
                        LicensePlate: this.state.licensePlateNum,
                        Color: this.state.vehicleColor
                    })
                 })
                 // add vehicle to mobx UserStore
                 this.props.UserStore.vehicles.push({
                    VehicleID: ref.id,
                    Year: this.state.yearSelected,
                    Make: this.state.makeSelected,
                    Model: this.state.modelSelected,
                    LicensePlate: this.state.licensePlateNum,
                    Color: this.state.vehicleColor
                 })

                 // navigate back to profile
                 this.props.navigation.goBack(null)
                 
        }else{
            
        }
        }else{
            alert("failed to submit vehicle")
        }
       
    }

    checkValid = () => {

    
        

        // Check if year is valid between 1900 and current year + 1
        if (this.state.yearSelected >= 1900 &&
            this.state.yearSelected <= (year + 1) &&
            this.state.yearSelected.length == 4 
            ){
                this.setState(prev => {
                    const error = {...prev.error};
                    error.year = "";
                    error.yearValid = true;
                    return { error }
                })
        }else{
            this.setState(prev => {
                const error = {...prev.error};
                error.year = "Invalid Year";
                error.yearValid = false;
                return { error }
            })
            }


        // Check if make is selected    
        if(this.state.makeSelected !== "Choose a Manufacturer..."){
            this.setState(prev => {
                const error = {...prev.error};
                error.make = "";
                error.makeValid = true;
                return { error }
            })
        }else{
            this.setState(prev => {
                const error = {...prev.error};
                error.make = "Select a make";
                error.makeValid = false;
                return { error }
            })
        }


        // Check if model is either selected or typed in
        if(
            this.state.modelSelected !== "Car Model..." &&
            this.state.modelSelected !== null &&
            this.state.modelSelected !== "" &&
            this.state.modelSelected !== " " ){
                this.setState(prev => {
                    const error = {...prev.error};
                    error.model = "";
                    error.modelValid = true;
                    return { error }
                })
        }else{
            this.setState(prev => {
                const error = {...prev.error};
                error.model = "Enter a model";
                error.modelValid = false;
                return { error }
            })
        }


        // Check that a value is given to license plate
        if(this.state.licensePlateNum.length >= 1 &&
            this.state.licensePlateNum !== " "){
            this.setState(prev => {
                const error = {...prev.error};
                error.licensePlate = "";
                error.licenseValid = true;
                return { error }
            })
        }else{
            this.setState(prev => {
                const error = {...prev.error};
                error.licensePlate = "Enter a license plate #";
                error.licenseValid = false;
                return { error }
            })
        }

       

        // console.log("year valid: " + this.state.error.yearValid)
        // console.log("make valid: " + this.state.error.makeValid)
        // console.log("model valid: " + this.state.error.modelValid)
        // console.log("license valid: " + this.state.error.licenseValid)
        // console.log(" ")

            
    }

    checkYearMake = () => {
       
        if (this.state.yearSelected !== null && this.state.yearSelected.length == 4
            && this.state.makeSelected !== "Choose a Manufacturer..."){
                this.setState({loadingVehicleAPI: true})
                axios.get('https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/' + this.state.makeSelected + '/modelyear/' + this.state.yearSelected + '/vehicleType/c?format=json')
                .then(response => {
                    if (this._isMounted){
                        this.setState({loadingVehicleAPI: false})
                        var arr = response.data.Results.filter(function(car){
                            return (car.VehicleTypeId == 2 ||
                                    car.VehicleTypeId == 3 ||
                                    car.VehicleTypeId == 7
                            )
                        });
                        unique = arr.filter((car, i, u) => u.findIndex(t=>(t.Model_ID === car.Model_ID)) === i)

                        // console.log(unique)
                        this.setState({modelEnabled: true})
                    }
                })
                .catch(error => {
                    console.log(error);
                });

                
        }else{
            this.setState({modelEnabled: false, modelSelected: null})
        }
    }

    componentDidMount(){
        this._isMounted = true;

        LogBox.ignoreLogs(['Warning: Picker has been extracted from react-native core']);
        
         // Set Status Bar page info here!
       this._navListener = this.props.navigation.addListener('didFocus', () => {
        StatusBar.setBarStyle('dark-content', true);
        Platform.OS === 'android' && StatusBar.setBackgroundColor('white');
      });
       
    }

    componentWillUnmount(){
        this._isMounted = false;

         // Unmount status bar info
         this._navListener.remove();
    }
    

    render(){
        var carObjArray = []
            for(var i = 0; i < Cars.length; i++){
                carObjArray.push({key: i, label:Cars[i], });
            }
        var colorArray = ["Black", 
                      "Blue", 
                      "Brown", 
                      "Gray", 
                      "Green", 
                      "Orange", 
                      "Pink", 
                      "Purple",
                      "Red",
                      "Silver",
                      "Yellow",
                      "White"]


        
        return(
            <ScrollView style={[styles.container, {flex: 1, backgroundColor: 'white'}]}>
                <View style={{flexDirection: "row" }}>
                    <Input 
                        flex= {6}
                        onChangeText = {(value) => this.setState({yearSelected: value}, () => {this.checkYearMake()})}
                        mask={"number"}
                        style={{height: 48}}
                        value={this.state.yearSelected}
                        label="Year"
                        placeholder="YYYY"
                        maxLength={4}
                        error={this.state.error.year}
                        keyboardType="numeric"
                    />
                    <View style={{marginLeft: 16, flex: 16}}>
                        <Dropdown
                            selectedValue = {this.state.makeSelected}
                            label="Make"
                            error={this.state.error.make}
                            style={{height: 28}}
                            onValueChange = {Platform.OS === "ios" ? (value) => this.setState({makeSelected: value.label}, () => {this.checkYearMake()}) 
                            : (value) => this.setState({makeSelected: value}, () => {this.checkYearMake()})}   
                        >
                            {Platform.OS === "android" ?
                                carObjArray.map((carMake) => {
                                    return(<Picker.Item label={carMake.label} value={carMake.label} key={carMake.key}/>)
                                })
                            : carObjArray}
                         </Dropdown>
                   
                    </View>

                    
                
                </View>
                <View style={{flexDirection: "row"}}>
                {this.state.loadingVehicleAPI ? <View style={{flex: 1, justifyContent: "center", alignContent: "center"}}><ActivityIndicator size="small" color={Colors.cosmos300}/></View> : null}
                { unique.length > 0 ?
                <View style={{flex: 11}}>
                    <Dropdown
                        enabled={this.state.modelEnabled}
                        selectedValue = {this.state.modelSelected}
                        label="Model"
                        style={{height: 28}}
                        error={this.state.error.model}
                        onValueChange = {Platform.OS === "ios" ? (value) => this.setState({modelSelected: value.label}) 
                                                               : (value) => this.setState({modelSelected: value})}                
                    >
                        {Platform.OS === "android" ?
                            unique.map((carModel) => {
                                return(<Picker.Item label={carModel.Model_Name} value={carModel.Model_Name} key={carModel.Model_ID}/>)
                            })
                            : unique.map((carModel) => {
                                return({label: carModel.Model_Name, key: carModel.Model_ID})
                            })}           
                       
                    </Dropdown>
                </View>
                         :
                         <View style={{flex: 11}}>
                            <Input 
                            editable={this.state.modelEnabled}
                            onChangeText = {(value) => this.setState({modelSelected: value})}
                            label="Model"
                            placeholder="Car Model..."
                            maxLength={30}
                            error={this.state.error.model}
                            keyboardType="default"/>
                        </View>
                }
                </View>
                <View style={{flexDirection: "row" }}>
                    <View style={{flex: 2}}>
                    <Input 
                            autoCapitalize = "characters"
                            onChangeText = {(value) => this.setState({licensePlateNum: value})}
                            label="License Plate"
                            placeholder="XXX-1234"
                            maxLength={8}
                            error={this.state.error.licensePlate}
                            keyboardType="default"/>
                    </View>
                        <View style={{marginLeft: 16, flex: 2}}>
                            <Dropdown
                                flex = {2}
                                selectedValue = {this.state.vehicleColor}
                                label="Color"
                                style={{height: 28}}
                                onValueChange = {Platform.OS === "ios" ? (value) => this.setState({vehicleColor: value.label}) 
                                                                       : (value) => this.setState({vehicleColor: value})}                  
                            >
                            { Platform.OS === "android" ? 
                                colorArray.map((res, i) => {
                                    return(<Picker.Item key={i} label={res} value={res}/>)
                                })
                                : colorArray.map((res, i) => {
                                    return({label: res, key: i})
                                })}                
                            </Dropdown> 
                            
                        </View>  
                </View> 
                <Button style={{backgroundColor: Colors.tango900}} textStyle={{color: 'white'}} onPress={() => this.submitVehicle()}>Save Vehicle</Button>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    container:{
        // flex: 1,
        // only use for emulator
        // marginTop: getStatusBarHeight(),
        padding: 20,
    
        // flexDirection: 'row'
    }
})





export default AddVehicle