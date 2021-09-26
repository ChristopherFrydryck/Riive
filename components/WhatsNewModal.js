import React, { Component } from 'react'
import {View, StyleSheet, Dimensions, Modal, Button} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import Text from '../components/Txt'


export default class NewModal extends Component{
    render(){
        return(
            <Modal visible={true} transparent={true}>
                <View style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, backgroundColor: 'rgba(176, 176, 176, 0.33)', justifyContent: 'center'}}>
                    <View style={{backgroundColor: 'white', borderRadius: 4, marginHorizontal: 8, paddingHorizontal: 8, paddingVertical: 16, maxHeight: Dimensions.get('window').height*(.8)}}>
                        <ScrollView alwaysBounceVertical={false}>
                            <Text>What's New</Text>
                        </ScrollView>
                        
                    </View>

                    
                </View>
                
            </Modal>
            
        )
    }
}

// style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, position: 'absolute', zIndex: 99999999, backgroundColor: 'rgba(176, 176, 176, 0.33)'}}