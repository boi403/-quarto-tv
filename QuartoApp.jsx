import React from 'react';
import './theme.css';
import HomeScreen from './HomeScreen';

// Mesma tela em todas as TVs — sem número de quarto.
export default function QuartoApp() {
  return <HomeScreen logoUrl="./logo-transparente.png" />;
}
