import React from 'react'
import {View, Text, StyleSheet, Dimensions} from 'react-native'


const topBar = ({...props}) => {
    const style = [styles.bar, props.style || {}]
    const allProps = Object.assign({}, props,{style:style})
    return(
        <View {...allProps}>
            {props.children}
        </View>
    )
}

const styles = StyleSheet.create({
    bar: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'flex-start',
        width: Dimensions.get('window').width - 16 ,
        height: 40,
        // position: 'absolute',
        marginTop: 10,
        
    }
})

export default topBar