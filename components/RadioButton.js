import React from 'react'
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native'

import Text from '../components/Txt';
import Colors from '../constants/Colors'

import { RadioButton } from 'react-native-paper';




const radioButton = ({id, selectItem, ...props}) => {
    const style = [styles.main, props.style || {}]
    const allProps = Object.assign({}, props,{style:style})
    

    return(
         <View {...allProps} key={id}>
            <RadioButton.Android disabled={props.disabled || false} value={id} color={Colors.tango900}/>
            <TouchableWithoutFeedback onPress={selectItem}>
                {props.children}
            </TouchableWithoutFeedback>
        </View>
    )
}


const styles = StyleSheet.create({
    main: {
        flexDirection: "row",
        alignItems: 'center',
    }
})

export default radioButton