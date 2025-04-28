// /src/utils/avatarColors.js

const avatarColorMap = {
    A: '#FF6B6B',
    B: '#FF8E53',
    C: '#FFA726',
    D: '#FFD54F',
    E: '#D4E157',
    F: '#9CCC65',
    G: '#26A69A',
    H: '#26C6DA',
    I: '#42A5F5',
    J: '#5C6BC0',
    K: '#7E57C2',
    L: '#AB47BC',
    M: '#EC407A',
    N: '#EF5350',
    O: '#8D6E63',
    P: '#BCAAA4',
    Q: '#A1887F',
    R: '#90A4AE',
    S: '#78909C',
    T: '#8E24AA',
    U: '#3949AB',
    V: '#1E88E5',
    W: '#00ACC1',
    X: '#00897B',
    Y: '#43A047',
    Z: '#F4511E',
  };
  
  // Default fallback color
  const DEFAULT_COLOR = '#BDBDBD';
  
  // Helper function
  export function getAvatarColor(letter) {
    const upperLetter = letter.toUpperCase();
    return avatarColorMap[upperLetter] || DEFAULT_COLOR;
  }
  