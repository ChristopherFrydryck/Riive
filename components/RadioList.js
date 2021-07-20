import React from 'react'
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native'

import Text from '../components/Txt';
import Colors from '../constants/Colors'

import { RadioButton } from 'react-native-paper';





const radioList = ({activeItem, selectItem, ...props}) => {
    const style = [styles.x, props.style || {}]
    const allProps = Object.assign({}, props,{style:style})
    const childrenArray = React.Children.toArray(props.children)

    return(
        <View {...allProps}>
            <RadioButton.Group onValueChange={(option) => selectItem(option)} value={activeItem ? activeItem : childrenArray[0].props.id}>
                {props.children}      
            </RadioButton.Group>
        </View>
    )
}


const styles = StyleSheet.create({
    x: {}
})

export default radioList