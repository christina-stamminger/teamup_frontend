export const getStatusColor = (status) => {
    switch (status) {
        case 'Offen':
            return '#5FC994'; // Kind of Green
          case 'In Arbeit':
            return '#FFB65C'; // Warm Peach
          case 'Abgelaufen':
            return '#404040'; // Dark Gray
          case 'Erledigt':
            return '#5c7cff'; // Soft Tealish Blue
          default:
            return '#5FC9C9'; // Default Main Color
    }
  };
  
  