import React, { Component } from 'react'
import {View, StyleSheet, Dimensions, Modal, Button} from 'react-native'

import Text from '../components/Txt'


export default class NewModal extends Component{
    render(){
        return(
            <Modal presentationStyle='pageSheet' style={{backgroundColor: 'green'}}>
                <Text>HELLO</Text>
            </Modal>
            
        )
    }
}

// style={{height: Dimensions.get('window').height, width:  Dimensions.get('window').width, position: 'absolute', zIndex: 99999999, backgroundColor: 'rgba(176, 176, 176, 0.33)'}}