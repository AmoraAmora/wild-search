import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

type ErrorSnackbarProps = {
  message: string | null;
  onClose: () => void;
};

const AUTO_HIDE_MS = 8000;

export function ErrorSnackbar({ message, onClose }: ErrorSnackbarProps) {
  return (
    <Snackbar
      open={message !== null}
      autoHideDuration={AUTO_HIDE_MS}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="error" variant="filled" onClose={onClose} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
