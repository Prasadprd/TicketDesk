import { extendTheme } from '@chakra-ui/react';

// Define the color palette
const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0080ff', // Primary brand color
    600: '#0066cc',
    700: '#004d99',
    800: '#003366',
    900: '#001a33',
  },
  accent: {
    50: '#fff0e6',
    100: '#ffd6b3',
    200: '#ffbd80',
    300: '#ffa34d',
    400: '#ff8a1a',
    500: '#ff7000', // Secondary accent color
    600: '#cc5a00',
    700: '#994300',
    800: '#662d00',
    900: '#331600',
  },
  success: {
    50: '#e6fff0',
    100: '#b3ffd6',
    200: '#80ffbd',
    300: '#4dffa3',
    400: '#1aff8a',
    500: '#00ff70',
    600: '#00cc5a',
    700: '#009943',
    800: '#00662d',
    900: '#003316',
  },
  error: {
    50: '#ffe6e6',
    100: '#ffb3b3',
    200: '#ff8080',
    300: '#ff4d4d',
    400: '#ff1a1a',
    500: '#ff0000',
    600: '#cc0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },
  warning: {
    50: '#fffbe6',
    100: '#fff3b3',
    200: '#ffec80',
    300: '#ffe44d',
    400: '#ffdd1a',
    500: '#ffd600',
    600: '#ccab00',
    700: '#998100',
    800: '#665600',
    900: '#332b00',
  },
  gray: {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
};

// Define the component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.600`,
        },
      }),
      outline: (props) => ({
        border: '2px solid',
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
      }),
      ghost: (props) => ({
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.50' : `${props.colorScheme}.50`,
        },
      }),
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Table: {
    variants: {
      simple: {
        th: {
          borderBottom: '2px solid',
          borderColor: 'gray.200',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: 'sm',
        },
        td: {
          borderBottom: '1px solid',
          borderColor: 'gray.100',
        },
      },
    },
    defaultProps: {
      variant: 'simple',
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: 'lg',
        boxShadow: 'xl',
      },
      header: {
        fontWeight: 'bold',
        fontSize: 'xl',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'md',
        overflow: 'hidden',
      },
      header: {
        padding: 4,
        borderBottom: '1px solid',
        borderColor: 'gray.100',
      },
      body: {
        padding: 4,
      },
      footer: {
        padding: 4,
        borderTop: '1px solid',
        borderColor: 'gray.100',
      },
    },
  },
};

// Define the global styles
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
};

// Define the fonts
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

// Define the theme config
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Create the theme
const theme = extendTheme({
  colors,
  components,
  styles,
  fonts,
  config,
});

export default theme;