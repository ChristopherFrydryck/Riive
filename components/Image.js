import React from 'react'
import { View, StyleSheet, Image, Dimensions, ImageBackground, TouchableOpacity } from 'react-native';
import backupImage from '../assets/img/LoadingImage.jpg'

// Props:
// source
// backupSource = backup if image fails or is loading
// underlayColor
// backupSource
// aspectRatio
// resizeMode
// enabled
// onPress
// accessibilityLabel

class Img extends React.Component{
    constructor(props){
        super(props)

        this.state={
            isReady: false,
        }
    }

    render(){
        const style = [styles.img,  this.props.style || {}]
        const allProps = Object.assign({}, this.props,{style:style}) 

        if(this.props.localImage){
            return (
                <TouchableOpacity
                    onPress={this.props.onPress}
                    disabled={this.props.onPress ? false : true}
                    {...allProps}
                >
                    <Image 
                        // underlayColor = {this.props.underlayColor}
                        style={{aspectRatio: this.props.aspectRatio, resizeMode: this.props.resizeMode, width: this.props.width, height: this.props.height, borderRadius: this.props.borderRadius}}
                        source={this.props.source}
                        defaultSource = {this.props.backupSource}
                        onLoad = {() => this.setState({imgReady: true})}
                    />
                </TouchableOpacity>
            )
        }else{
            return(
                <TouchableOpacity

                    onPress={this.props.onPress}
                    disabled={this.props.onPress ? false : true}
                    {...allProps}
                >
                    
                    <ImageBackground
                        source={this.props.backupSource ? this.props.backupSource : backupImage}
                        style={{width: this.props.width, height: this.props.height,}}
                        imageStyle={{aspectRatio: this.props.aspectRatio, resizeMode: this.props.resizeMode,  borderRadius: this.props.borderRadius}}
                        
                        // {...allProps}
                    >
                        <Image 
                            
                            underlayColor = {this.props.underlayColor}
                            style={{aspectRatio: this.props.aspectRatio, resizeMode: this.props.resizeMode, width: this.props.width, height: this.props.height, borderRadius: this.props.borderRadius}}
                            source={this.props.source}
                            defaultSource = {this.props.backupSource}
                            onLoad = {() => this.setState({imgReady: true})}
                            // {...allProps}
                        />
                    </ImageBackground>
                    
                </TouchableOpacity>
            )
        }
    }    
}

const styles = StyleSheet.create({
    img: {
        height: null,
        width: null,
        
    }
})

export default Img