import React from 'react';

import Icon from '../components/Icon'

import Colors from '.././constants/Colors';

export default function TabBarIcon(props) {
  return (
    <Icon 
      iconLib="Feather"
      iconSize={24}
      iconName={props.name}
      style={{ paddingBottom: 8 }}
      iconColor={props.focused ? Colors.tango700 : Colors.cosmos300}
    />
  );
}