import React from 'react';
import Shuffle from './Shuffle';
export default function ContactFooter(){
 return <Shuffle text="/ CONTACT" tag="span" className="contact-shuffle" textAlign="left" effect="slide" shuffleDirection="up" animationMode="sequence" duration={.45} stagger={.04} shuffleTimes={1} triggerOnce={true} triggerOnHover={true} loop={false} motionBlur={false} respectReducedMotion={true} threshold={.12} rootMargin="0px"/>;
}
