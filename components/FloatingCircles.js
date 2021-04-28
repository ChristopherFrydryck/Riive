import React from 'react'
import { View, Text, StyleSheet, TouchableHighlight, Dimensions, Animated, Easing} from 'react-native';

import Colors from '../constants/Colors'

export default class FloatingCircles extends React.Component{
    constructor(props){
        super(props)
       
        this.circles = []
        for(let i = 0; i < this.props.numCircles; i++){
            this.circles[i] = new Animated.Value(0)
        }

    }

    componentDidMount () {
        this.animate();
    }



    animate = async() => {
        let animationStarted = false;
        await this.circles.forEach((x, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(          // Animate over time
                        x, // The animated value to drive
                        {
                            toValue: this.props.movement,           // Animate to 20 (opaque)
                            duration: this.props.duration/2,
                                // 1000ms
                        }
                    ),
                    Animated.timing(          // Animate over time
                        x, // The animated value to drive
                        {
                            toValue: 0,           // Animate to 0 (opaque)
                            duration: animationStarted ? this.props.duration/2 : this.props.duration/2 - (i * 20), 
                               // 1000ms
                        }
                    ),
                ]) 
            ).start();

            
        })
        animationStarted = true;
    //    Animated.stagger(275, this.animation).start();
    }              
    

    render(){
       
        return(
            <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: this.props.width, height: this.props.height}}>
                {
                    
                    this.circles.map((value, i) => {
                        return <Animated.View key={i} style={{width: this.props.size, height: this.props.size, backgroundColor: this.props.color, borderRadius: this.props.size/2, top: value, position: 'relative', }}/>
                    })
                }
                {/* <Animated.View style={{width: 12, height: 12, backgroundColor: 'green', borderRadius: 6, marginTop: this.state.yTranslation}}/>
                <Animated.View style={{width: 12, height: 12, backgroundColor: 'green', borderRadius: 6, marginTop: this.state.yTranslation}}/>
                <Animated.View style={{width: 12, height: 12, backgroundColor: 'green', borderRadius: 6, marginTop: this.state.yTranslation}}/> */}
            </View>
        )
    }

}

FloatingCircles.defaultProps = {
    numCircles: 3,
    color: Colors.cosmos900,
    size: 12,
    duration: 1000,
    movement: 8,
    width: 3 * 16,
    height: (8+12)
};


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