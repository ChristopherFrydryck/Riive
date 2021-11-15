import React from 'react'
import { View, StyleSheet, TouchableHighlight, Dimensions, TouchableOpacity } from 'react-native';
import Text from '../components/Txt'



const ClickableChip = ({ onPress, bgColor, textColor, ...props}) => {
    const style = [[styles.chip, {backgroundColor: bgColor}], props.style || {}]
    const allProps = Object.assign({}, props,{style:style})
    return(
        <View>
            <TouchableOpacity onPress={onPress} {...allProps}>
                <Text type="Medium" style={{color: textColor}}>{props.children}</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    chip:{
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 50,
        alignContent: 'center',
      
    }
})

export default ClickableChip