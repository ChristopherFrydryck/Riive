import React, {Component} from 'react'
import { View, ScrollView, StatusBar, Platform, StyleSheet, RefreshControl, SectionList, ActivityIndicator, Modal, SafeAreaView, Linking, TouchableOpacity, Animated, Easing} from 'react-native'


import Button from '../components/Button'
import Text from '../components/Txt'
import Icon from '../components/Icon'
import Image from '../components/Image'
import Colors from '../constants/Colors'

import MapView, {Marker} from 'react-native-maps';
import Clipboard from '@react-native-clipboard/clipboard';
import DayMap from '../constants/DayMap'
import NightMap from '../constants/NightMap'

import * as firebase from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import 'firebase/auth';
import 'firebase/firestore';

//MobX Imports
import {inject, observer} from 'mobx-react/native'


@inject("UserStore", "ComponentStore")
@observer
export default class ReportTrip extends Component{

   constructor(props){
        super(props);
        this.state = {
            // isRefreshing: false,
            // visits: [],
            // lastRenderedItem: null,
            // selectedVisit: null,
            // modalVisible: false,
            // slideUpAnimation: new Animated.Value(-100),

            // secitonlist stuff
            
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
        return(
            <View style={styles.container}>
                <Text>Report Trip</Text>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 8,
        paddingHorizontal: 8,
        backgroundColor: "white"
    },
    sectionHeader: {
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 20,
        fontWeight: '400',
        color: Colors.cosmos700,
        backgroundColor: 'white'
      },
    sectionHeaderPast: {
        color: '#c2c2c2',
    },
    
      item: {
        padding: 10,
        fontSize: 18,
        height: 44,
      },
      visitCard: {
          backgroundColor: 'white',
          
          height: 100,
          marginVertical: 8,
          marginHorizontal: 4,
        //   shadowColor: '#000', 
        //   shadowOpacity: 0.6, 
        //   shadowOffset:{width: 2, height: 2}, 
        //   shadowRadius: 3, 
        //   elevation: 12,
        //   borderRadius: 4,
      },
      searchToastPill: {
        height: 40, 
        backgroundColor: Colors.mist300, 
        position: 'absolute', 
        alignSelf: 'center', 
        alignItems: 'center', 
        flexDirection: 'row',
        justifyContent: 'center', 
        borderRadius: 24, 
        paddingHorizontal: 16,
        shadowColor: Colors.cosmos900,
        shadowOffset: {
            width: 0,
            height: 20,
        },
        shadowOpacity: .5,
        shadowRadius: 20,
        elevation: 12,
    },
})