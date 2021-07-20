import React from 'react'
import { View, Text, StyleSheet, TouchableHighlight, Dimensions, TouchableOpacity} from 'react-native';

const Circle = ({ onPress, top, left, width, height, color, ...props}) => {
    const style = [styles.circle, props.style || {}]
    const allProps = Object.assign({}, props,{style:style})
    return(
        <View style={[styles.container], {left: left, top: top, width: width, height: height}}>
            <TouchableOpacity 
                {...allProps}
                onPress={onPress}
            >
                {props.children}
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignContent: 'center',
        justifyContent: 'center',
    },  
    circle: {
        borderRadius: Math.round(Dimensions.get('window').width + Dimensions.get('window').height) / 2,
        justifyContent: 'center',

        alignItems: 'center',
        position: "relative",
        // shadowColor: '#000', 
        //   shadowOpacity: 0.6, 
        //   shadowOffset:{width: 10, height: 20}, 
        //   shadowRadius: 20, 
        //   elevation: 20,
    }

})

export default Circle;