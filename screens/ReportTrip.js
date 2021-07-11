import React, { Component } from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, SafeAreaView, Dimensions, KeyboardAvoidingView, FlatList, Switch, Modal, Picker, LogBox, Alert, Linking} from 'react-native';

import Text from '../components/Txt'
import Icon from '../components/Icon'
import Input from '../components/Input'
import Button from '../components/Button'
import Colors from '../constants/Colors'
import Dropdown from '../components/Dropdown'
import DropdownItem from '../components/DropdownItem'

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

//MobX Imports
import {inject, observer} from 'mobx-react/native'


@inject("UserStore", "ComponentStore")
@observer
export default class ReportTrip extends Component{
   array = [
        {
            index: 0,
            label: "I am being scammed",
            db: "SPACE_ISSUE"
        },
        {
            index: 1,
            label: "The host was offensive",
            db: "HOST_ISSUE"
        },
        {
            index: 2,
            label: "Something else",
            db: "OTHER_ISSUE"
        },
    ]

   constructor(props){
        super(props);
        this.state = {
           reportReason: this.array[0],
           reportText: "",
            
        }
   }

   componentDidMount(){
        // Set Status Bar page info here!
    this._navListener = this.props.navigation.addListener('didFocus', () => {
            StatusBar.setBarStyle('dark-content', true);
            Platform.OS === 'android' && StatusBar.setBackgroundColor('white');   

        });

        this.props.navigation.setParams({
            title: "Report Trip",
          });
        

    }
    render(){
        
        // let {type, number, bankProvider, bankToken, cardType, fingerprint, id} = this.props.UserStore.directDepositInfo
        return(
            <KeyboardAwareScrollView 
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustContentInsets={false}
                scrollEnabled
                enableOnAndroid={true}
                extraScrollHeight={150} //iOS
                extraHeight={135} //Android
                style={{backgroundColor: 'white', paddingTop: 16}} 
                contentContainerStyle={{flexShrink: 1, justifyContent: 'center'}}
            >
                <View style={[styles.container, {flexDirection: 'row', alignItems: 'center'}]}>
                  <Icon 
                      iconName="report"
                      iconLib="MaterialIcons"
                      iconSize={32}
                      style={{marginRight: 4}}
                  />
                  <Text style={{fontSize: 20, }} type="SemiBold">Report Trip</Text>
                 
                        
                  
                </View>
                <View style={[styles.container, {flex: 1}]}>
                    <Dropdown
                        flex={0}
                        selectedValue = {this.state.reportReason.label}
                        label="Report Reason"
                        // error={this.state.error.make}
                        style={{height: 32}}
                        onValueChange = {(res) => Platform.OS == 'ios' ? this.setState({reportReason: res}) : this.setState({address: {...this.state.address, line2Prefix: res || "Hello"}})}
                     >
                        {
                            this.array.map((x, i) => {
                                if(Platform.OS === 'ios'){
                                      return(
                                          {key: x.index, label: x.label, baseValue: x.db}
                                      )
                                 }
                                else{
                                     return(
                                        <DropdownItem key={x.index} label={x.label} value={x.db}/>
                                     )
                                 }
                             })
                        }
                    </Dropdown>
                    <Input 
                        placeholder='Add a bio...'         
                        label="Report Details"
                        name="space bio"                 
                        onChangeText= {reportText => this.setState({reportText})}
                        value={this.state.reportText}
                        mask="multiline"
                        numLines={4}
                        rightText={`${this.state.reportText.length}/300`}
                        maxLength = {300}
                        keyboardType='default'
                        // error={this.state.bioError}
                        />
                </View>
                <Button onPress={() => console.log(this.state.reportText)}>Test</Button>
                
 
                
            </KeyboardAwareScrollView>
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