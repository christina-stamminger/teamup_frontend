export const getStatusColor = (status) => {
    switch (status) {
        case 'OFFEN':
            return '#5FC994'; // Kind of Green
          case 'IN_ARBEIT':
            return '#FFB65C'; // Warm Peach
          case 'ABGELAUFEN':
            return '#404040'; // Dark Gray
          case 'ERLEDIGT':
            return '#5c7cff'; // Soft Tealish Blue
          default:
            return '#5FC9C9'; // Default Main Color
    }
  };
  
  