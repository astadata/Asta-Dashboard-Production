import { red } from '@mui/material/colors';
import { components } from './components';

const themeOptions = {
  typography: {
    fontSize: 13,
    body1: { fontSize: '13px' },
    body2: { fontSize: '12px' },
    h1: { fontSize: '2rem' },
    h2: { fontSize: '1.75rem' },
    h3: { fontSize: '1.5rem' },
    h4: { fontSize: '1.25rem' },
    h5: { fontSize: '1.1rem' },
    h6: { fontSize: '1rem' },
  },

  status: { danger: red[500] },
  components: { ...components },
};

export default themeOptions;
